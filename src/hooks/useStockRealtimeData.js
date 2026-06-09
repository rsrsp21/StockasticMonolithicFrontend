import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStockWebSocket } from "./useStockWebSocket";
import { useKYCStatus } from "./useKYCStatus";
import { getStockById, getLatestPrice, getPriceHistory } from "../services/stockPriceService";
import {
    isMarketOpen as checkMarketOpen,
    isTradingDay,
    isPostCloseSyncWindow as checkPostCloseSyncWindow,
    getMarketClosedReason,
    getMillisecondsUntilNextMarketChange
} from "../utils/marketUtils";

export function useStockRealtimeData(stockId) {
    // Market status
    const [isMarketOpen, setIsMarketOpen] = useState(checkMarketOpen());
    const [isPostCloseSyncWindow, setIsPostCloseSyncWindow] = useState(checkPostCloseSyncWindow());
    const [marketStatusMessage, setMarketStatusMessage] = useState(
        checkPostCloseSyncWindow() ? "Finalizing close data..." : (!checkMarketOpen() ? getMarketClosedReason() : "Market Open")
    );

    // Stock data state
    const [dayOpenPrice, setDayOpenPrice] = useState(null);
    const [latestHistoryData, setLatestHistoryData] = useState(null);
    const [avgVolume, setAvgVolume] = useState(null);
    const [dayVolume, setDayVolume] = useState(null);

    // 1. Market Status Effect
    useEffect(() => {
        let timer;
        const checkAndScheduleNext = () => {
            const open = checkMarketOpen();
            const postCloseSyncWindow = checkPostCloseSyncWindow();
            const msg = postCloseSyncWindow
                ? "Finalizing close data..."
                : (!open ? getMarketClosedReason() : "Market Open");

            if (open !== isMarketOpen) {
                setIsMarketOpen(open);
            }
            if (postCloseSyncWindow !== isPostCloseSyncWindow) {
                setIsPostCloseSyncWindow(postCloseSyncWindow);
            }
            setMarketStatusMessage(msg);

            const msUntilChange = getMillisecondsUntilNextMarketChange();
            if (msUntilChange !== null) {
                timer = setTimeout(checkAndScheduleNext, msUntilChange);
            }
        };

        checkAndScheduleNext();
        return () => clearTimeout(timer);
    }, [isMarketOpen, isPostCloseSyncWindow]);
    
    const queryClient = useQueryClient();

    // 2. Scheduled Data Refresh Logic (X:M+2:00)
    useEffect(() => {
        if (!stockId) return;

        const refreshData = () => {
            queryClient.invalidateQueries({ queryKey: ["stock", stockId] });
            queryClient.invalidateQueries({ queryKey: ["latestPrice", stockId] });
            queryClient.invalidateQueries({ queryKey: ["stockHistoryToday", stockId] });
        };

        const calculateTimeUntilNextFetch = () => {
            const now = new Date();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();

            // Frontend sync minute is X:02 for each 5-min cycle (e.g. 9:17, 9:22, 9:27...)
            // This is +1 minute after backend X:01 scheduler.
            const minutesUntilSync = (2 - (minutes % 5) + 5) % 5;
            let msUntilSync = (minutesUntilSync * 60 * 1000) - (seconds * 1000) - milliseconds;
            if (msUntilSync <= 0) msUntilSync += 5 * 60 * 1000;
            return msUntilSync;
        };

        let timeout;
        let interval;
        let postCloseTimeout332;
        let postCloseTimeout340;

        const now = new Date();
        const hourPart = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            hour12: false,
            hour: "2-digit",
        }).formatToParts(now).find((p) => p.type === "hour")?.value || "00";
        const minutePart = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            hour12: false,
            minute: "2-digit",
        }).formatToParts(now).find((p) => p.type === "minute")?.value || "00";
        const secondPart = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            hour12: false,
            second: "2-digit",
        }).formatToParts(now).find((p) => p.type === "second")?.value || "00";

        const istHour = parseInt(hourPart, 10);
        const istMinute = parseInt(minutePart, 10);
        const istSecond = parseInt(secondPart, 10);
        const isTodayTrading = isTradingDay(now);

        const schedule = () => {
            const ms = calculateTimeUntilNextFetch();
            timeout = setTimeout(() => {
                refreshData();
                interval = setInterval(refreshData, 300000); // Every 5 mins
            }, ms);
        };

        if (isMarketOpen) {
            schedule();
        } else if (isTodayTrading && istHour === 15 && istMinute <= 40) {
            const currentSecondMs = (istSecond * 1000) + now.getMilliseconds();

            // Final chart/indicator sync at 3:32 PM IST (T+120s for 3:30 candle)
            if (istMinute < 32 || (istMinute === 32 && currentSecondMs < 1000)) {
                const msTo332 = ((32 - istMinute) * 60 * 1000) - currentSecondMs;
                postCloseTimeout332 = setTimeout(refreshData, Math.max(msTo332, 0));
            } else if (istMinute >= 32) {
                // If user opens after 3:32 PM, do one immediate catch-up.
                postCloseTimeout332 = setTimeout(refreshData, 1000);
            }

            // Reconciliation sync at 3:40 PM IST
            if (istMinute < 40 || (istMinute === 40 && currentSecondMs < 1000)) {
                const msTo340 = ((40 - istMinute) * 60 * 1000) - currentSecondMs;
                postCloseTimeout340 = setTimeout(refreshData, Math.max(msTo340, 0));
            }
        }

        return () => {
            clearTimeout(timeout);
            clearTimeout(postCloseTimeout332);
            clearTimeout(postCloseTimeout340);
            if (interval) clearInterval(interval);
        };
    }, [isMarketOpen, stockId, queryClient]);

    // 3. Data Queries
    const { data: stock, isLoading: isStockLoading, error: stockError } = useQuery({
        queryKey: ["stock", stockId],
        queryFn: () => getStockById(stockId),
        enabled: !!stockId,
        staleTime: 1000 * 60 * 5,
    });

    const { data: priceData, isLoading: isPriceLoading } = useQuery({
        queryKey: ["latestPrice", stockId],
        queryFn: () => getLatestPrice(stockId),
        enabled: !!stockId,
        refetchInterval: false, // WebSocket handles live updates; no polling needed
    });

    const { data: historyData } = useQuery({
        queryKey: ["stockHistoryToday", stockId],
        queryFn: async () => {
            const now = new Date();
            const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
            const partsFormatter = new Intl.DateTimeFormat("en-US", {
                timeZone: "Asia/Kolkata",
                hour12: false,
                hour: "2-digit",
            });
            const hourPart = partsFormatter.formatToParts(now).find((p) => p.type === "hour")?.value || "00";
            const istHour = parseInt(hourPart, 10);
            const isTodayTrading = isTradingDay(now);

            let targetDate = dateFormatter.format(now);

            // On holidays/weekends and pre-market, show the latest trading day's 1D data.
            if (!isTodayTrading || istHour < 9) {
                try {
                    const latest = await getLatestPrice(stockId);
                    if (latest?.priceTime) {
                        targetDate = latest.priceTime.split("T")[0];
                    }
                } catch {
                    // Keep fallback targetDate if latest price lookup fails.
                }
            }

            return getPriceHistory(stockId, `${targetDate}T09:15:00`, `${targetDate}T16:00:00`);
        },
        enabled: !!stockId,
        staleTime: 1000 * 60,
    });

    // 3. Derived History Stats
    useEffect(() => {
        if (!historyData) return;

        const prices = historyData.priceHistory || historyData.prices || historyData.content || historyData || [];

        if (Array.isArray(prices) && prices.length > 0) {
            const sortedPrices = [...prices].sort((a, b) =>
                new Date(a.priceTime).getTime() - new Date(b.priceTime).getTime()
            );

            setDayOpenPrice(sortedPrices[0].price);

            const latestEntry = sortedPrices[sortedPrices.length - 1];
            // Keep existing logic for latestHistoryData if needed elsewhere, or simplify
            setLatestHistoryData({
                ...latestEntry,
                volume: latestEntry.volume // Simplified to just latest entry
            });

            const nonZeroVolumes = sortedPrices.filter(entry => entry.volume && entry.volume > 0);
            const totalVolume = nonZeroVolumes.reduce((sum, entry) => sum + entry.volume, 0);
            setDayVolume(totalVolume); // Save total volume

            const calculatedAvgVolume = nonZeroVolumes.length > 0
                ? Math.round(totalVolume / nonZeroVolumes.length)
                : 0;
            setAvgVolume(calculatedAvgVolume);
        }
    }, [historyData]);

    // 4. WebSocket & KYC
    const { kycStatus } = useKYCStatus();
    const isKYCApproved = kycStatus === "APPROVED";
    const { price: wsPrice, connected: wsConnected } = useStockWebSocket(stockId, isMarketOpen);

    // 5. Price Calculations
    const currentPrice = isPostCloseSyncWindow
        ? latestHistoryData?.price || priceData?.price || 0
        : ((isMarketOpen && wsConnected && wsPrice?.price) || priceData?.price || 0);
    const effectiveOpenPrice = isPostCloseSyncWindow
        ? dayOpenPrice || latestHistoryData?.openPrice || priceData?.openPrice
        : (wsPrice?.openPrice || priceData?.openPrice || dayOpenPrice || latestHistoryData?.openPrice);

    let priceChangePercent = 0;
    let priceChange = 0;
    const backendChangePercent = isPostCloseSyncWindow
        ? undefined
        : (wsPrice?.changePercent ?? priceData?.changePercent);

    if (backendChangePercent !== undefined && backendChangePercent !== null) {
        priceChangePercent = backendChangePercent;
        if (currentPrice) {
            const factor = 1 + (priceChangePercent / 100);
            const baseline = currentPrice / factor;
            priceChange = currentPrice - baseline;
        }
    } else if (effectiveOpenPrice && currentPrice) {
        priceChange = currentPrice - effectiveOpenPrice;
        priceChangePercent = ((priceChange / effectiveOpenPrice) * 100);
    }

    const isPositive = priceChange >= 0;

    // Derived Display Values
    const dayHigh = (isMarketOpen && wsPrice?.dayHigh) || latestHistoryData?.dayHigh || priceData?.dayHigh;
    const dayLow = (isMarketOpen && wsPrice?.dayLow) || latestHistoryData?.dayLow || priceData?.dayLow;
    const fiftyTwoWeekHigh = (isMarketOpen && wsPrice?.fiftyTwoWeekHigh) || priceData?.fiftyTwoWeekHigh;
    const fiftyTwoWeekLow = (isMarketOpen && wsPrice?.fiftyTwoWeekLow) || priceData?.fiftyTwoWeekLow;
    // Prefer WS Volume (Daily) -> Calculated Total Volume (from history) -> PriceData Volume (from latest price API)
    const volume = (isMarketOpen && wsPrice?.volume) || dayVolume || priceData?.volume;

    return {
        stock,
        isStockLoading,
        stockError,
        isMarketOpen,
        isPostCloseSyncWindow,
        marketStatusMessage,
        currentPrice,
        priceChange,
        priceChangePercent,
        isPositive,
        effectiveOpenPrice,
        dayHigh,
        dayLow,
        fiftyTwoWeekHigh,
        fiftyTwoWeekLow,
        volume,
        avgVolume,
        historyData,
        wsPrice,
        wsConnected,
        isKYCApproved,
        isLoading: isStockLoading || isPriceLoading,
        
        // Indicators - Only from REST API (priceData refresh at M+2:00)
        rsiValue: priceData?.rsiValue,
        rsiVerdict: priceData?.rsiVerdict,
        macdValue: priceData?.macdValue,
        macdSignal: priceData?.macdSignal,
        macdVerdict: priceData?.macdVerdict,
        finalVerdict: priceData?.finalVerdict
    };
}
