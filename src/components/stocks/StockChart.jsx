/**
 * Stock Chart Component
 * Displays interactive price chart with multiple timeframes
 * 1D uses fixed 76 intervals from 9:15 AM to 3:30 PM IST
 * Other timeframes use Yahoo Finance historical data
 */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    AreaChart,
    Area,
    Line as ReLine,
    Bar as ReBar,
    LineChart as ReLineChart,
    ComposedChart,
    ReferenceLine,
    XAxis as ReXAxis,
    YAxis as ReYAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
} from "recharts";
import { Button } from "../ui/button";
import { Loader2, TrendingUp, TrendingDown, BarChart2, LineChart } from "lucide-react";
import {
    getPriceHistory,
    getLatestPrice,
    getIndicatorSeries,
    getChartData1W,
    getChartData1M,
    getChartData3M,
    getChartData1Y,
    getChartData3Y
} from "../../services/stockPriceService";
import { isTradingDay } from "../../utils/marketUtils";
import { useTheme } from "next-themes";

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip as ChartTooltip,
} from 'chart.js';
import { Chart as ReactChart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import { enIN } from 'date-fns/locale';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    CandlestickController,
    CandlestickElement,
    ChartTooltip
);

const TIMEFRAMES = [
    { key: "1D", label: "1D", available: true },
    { key: "1W", label: "1W", available: true },
    { key: "1M", label: "1M", available: true },
    { key: "3M", label: "3M", available: true },
    { key: "1Y", label: "1Y", available: true },
    { key: "3Y", label: "3Y", available: true },
];

// Generate all 76 time slots from 9:15 AM to 3:30 PM inclusive (every 5 minutes)
const generateTimeSlots = (dateStr) => {
    const slots = [];
    let hour = 9;
    let minute = 15;

    for (let i = 0; i < 76; i++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const timestamp = new Date(`${dateStr}T${timeStr}:00`).getTime();
        slots.push({
            time: timeStr,
            timestamp,
            slotIndex: i,
            price: null, // Short for Close
            open: null,
            high: null,
            low: null,
            volume: null,
        });

        minute += 5;
        if (minute >= 60) {
            minute = 0;
            hour++;
        }
    }
    return slots;
};

const calculateEMA = (values, period, seedFromFirst = false) => {
    const ema = new Array(values.length).fill(null);
    if (!Array.isArray(values) || values.length === 0) return ema;

    if (seedFromFirst) {
        ema[0] = values[0];
        const multiplier = 2 / (period + 1);
        for (let i = 1; i < values.length; i++) {
            ema[i] = ((values[i] - ema[i - 1]) * multiplier) + ema[i - 1];
        }
        return ema;
    }

    if (values.length < period) return ema;

    let sum = 0;
    for (let i = 0; i < period; i++) sum += values[i];
    ema[period - 1] = sum / period;

    const multiplier = 2 / (period + 1);
    for (let i = period; i < values.length; i++) {
        ema[i] = ((values[i] - ema[i - 1]) * multiplier) + ema[i - 1];
    }
    return ema;
};

const withIndicatorSeries = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const valid = data
        .map((item, index) => ({ index, close: item?.price }))
        .filter((item) => item.close != null);

    const result = data.map((item) => ({
        ...item,
        rsi: null,
        macd: null,
        macdSignalSeries: null,
        macdHistogram: null,
    }));

    if (valid.length < 15) return result;

    const closes = valid.map((item) => Number(item.close));

    const rsiValues = new Array(closes.length).fill(null);
    {
        const period = 14;
        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const diff = closes[i] - closes[i - 1];
            if (diff > 0) gains += diff;
            else losses += Math.abs(diff);
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        rsiValues[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

        for (let i = period + 1; i < closes.length; i++) {
            const diff = closes[i] - closes[i - 1];
            const gain = diff > 0 ? diff : 0;
            const loss = diff < 0 ? Math.abs(diff) : 0;
            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;
            rsiValues[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
        }
    }

    const ema12 = calculateEMA(closes, 12, true);
    const ema26 = calculateEMA(closes, 26, true);
    const macdValues = closes.map((_, i) => {
        if (ema12[i] == null || ema26[i] == null) return null;
        return ema12[i] - ema26[i];
    });

    const macdCompact = [];
    const macdIndexes = [];
    macdValues.forEach((value, idx) => {
        if (value != null) {
            macdCompact.push(value);
            macdIndexes.push(idx);
        }
    });

    const signalCompact = calculateEMA(macdCompact, 9, true);
    const signalByCloseIndex = new Array(closes.length).fill(null);
    signalCompact.forEach((value, compactIdx) => {
        if (value != null) {
            signalByCloseIndex[macdIndexes[compactIdx]] = value;
        }
    });

    valid.forEach((entry, validIdx) => {
        const rsi = rsiValues[validIdx];
        const macd = macdValues[validIdx];
        const signal = signalByCloseIndex[validIdx];
        result[entry.index].rsi = rsi == null ? null : Number(rsi.toFixed(2));
        result[entry.index].macd = macd == null ? null : Number(macd.toFixed(2));
        result[entry.index].macdSignalSeries = signal == null ? null : Number(signal.toFixed(2));
        result[entry.index].macdHistogram =
            macd == null || signal == null ? null : Number((macd - signal).toFixed(2));
    });

    return result;
};

const parseIstLocalDateTime = (value) => {
    if (!value) return null;
    const withZone = value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}+05:30`;
    const parsed = new Date(withZone);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const getIstClock = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const second = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);
    return { now, hour, minute, second };
};

export function StockChart({
    stockId,
    symbol,
    exchange,
    wsPrice,
    wsConnected,
    isMarketOpen,
    dayHistory,
    availableTimeframes = TIMEFRAMES.map((tf) => tf.key),
    historicalRangeFetcher = null,
    disableAutoRefresh = false,
    emptyStateTitle = null,
    emptyStateSubtitle = null,
}) {
    const { resolvedTheme } = useTheme();
    const [timeframe, setTimeframe] = useState("1D");
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [targetDate, setTargetDate] = useState(null);
    const [chartType, setChartType] = useState("area"); // "area" or "candle"
    const [showRsi, setShowRsi] = useState(false);
    const [showMacd, setShowMacd] = useState(false);
    const [indicatorSeries, setIndicatorSeries] = useState(null);
    const refreshIntervalRef = useRef(null);
    const chartCache = useRef({});

    // Clear cache when stock changes
    useEffect(() => {
        chartCache.current = {};
    }, [stockId, symbol]);

    // Calculate if price is up or down from chart data
    // Use Previous Close (yesterday's close) as baseline - this is the professional standard
    const filledData = chartData.filter(d => d.price !== null);
    const lastPrice = filledData.length > 0 ? filledData[filledData.length - 1].price : 0;

    // Try to get Previous Close from data (backend provides this)
    // If not available, fall back to first price of the day
    const previousClose = filledData.length > 0 && filledData[0].previousClose
        ? filledData[0].previousClose
        : (filledData.length > 0 ? filledData[0].price : 0);

    const isPositive = lastPrice >= previousClose;

    // Check if current timeframe is available
    const enabledTimeframes = useMemo(
        () => TIMEFRAMES.filter((tf) => availableTimeframes.includes(tf.key)),
        [availableTimeframes]
    );
    useEffect(() => {
        if (!enabledTimeframes.some((tf) => tf.key === timeframe) && enabledTimeframes.length > 0) {
            setTimeframe(enabledTimeframes[0].key);
        }
    }, [enabledTimeframes, timeframe]);
    const currentTimeframeConfig = enabledTimeframes.find(tf => tf.key === timeframe);
    const isTimeframeAvailable = currentTimeframeConfig?.available ?? false;
    const isTodayTradingDay = isTradingDay(new Date());
    const areIndicatorsAvailableForTimeframe = timeframe === "1D";
    const chartThemeColors = useMemo(() => {
        const toCanvasHsl = (token, fallback) => {
            if (!token) return fallback;
            const parts = token.trim().split(/\s+/);
            if (parts.length >= 3) {
                return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
            }
            return fallback;
        };

        if (typeof window === "undefined") {
            return {
                border: "rgba(148, 163, 184, 0.35)",
                muted: "rgba(148, 163, 184, 0.9)",
            };
        }

        const styles = getComputedStyle(document.documentElement);
        const border = styles.getPropertyValue("--border").trim();
        const muted = styles.getPropertyValue("--muted-foreground").trim();

        return {
            border: toCanvasHsl(border, "rgba(148, 163, 184, 0.35)"),
            muted: toCanvasHsl(muted, "rgba(148, 163, 184, 0.9)"),
        };
    }, [resolvedTheme]);
    const chartDataWithIndicators = useMemo(() => {
        const localSeries = withIndicatorSeries(chartData);

        if (timeframe !== "1D" || !indicatorSeries?.points?.length) {
            return localSeries;
        }

        const byTimestamp = new Map(
            indicatorSeries.points
                .map((point) => {
                    const ts = parseIstLocalDateTime(point.time);
                    return ts == null
                        ? null
                        : [ts, {
                            rsi: point.rsi ?? null,
                            macd: point.macd ?? null,
                            macdSignalSeries: point.signal ?? null,
                            macdHistogram: point.histogram ?? null,
                        }];
                })
                .filter(Boolean)
        );

        return localSeries.map((row) => {
            const backend = byTimestamp.get(row.x);
            return backend ? { ...row, ...backend } : row;
        });
    }, [chartData, timeframe, indicatorSeries]);

    useEffect(() => {
        setIndicatorSeries(null);
    }, [stockId, timeframe]);

    const fetchIndicatorSeriesData = useCallback(async () => {
        if (!(showRsi || showMacd) || timeframe !== "1D" || !stockId) return;
        try {
            const response = await getIndicatorSeries(stockId, "1D");
            setIndicatorSeries(response);
        } catch (e) {
            setIndicatorSeries(null);
        }
    }, [showRsi, showMacd, timeframe, stockId]);

    useEffect(() => {
        fetchIndicatorSeriesData();
    }, [fetchIndicatorSeriesData]);

    // Keep indicator series in sync with price polling cadence (X+2) and post-close sync points.
    useEffect(() => {
        if (!(showRsi || showMacd) || timeframe !== "1D" || !stockId) return;

        let timeout;
        let interval;
        let postClose332;
        let postClose340;

        const scheduleAlignedRefresh = () => {
            const { now, hour, minute, second } = getIstClock();
            const isTrading = isTradingDay(now);

            if (isMarketOpen) {
                const minutesUntilSync = (2 - (minute % 5) + 5) % 5;
                let msToFirstFetch = (minutesUntilSync * 60 * 1000) - (second * 1000) - now.getMilliseconds();
                if (msToFirstFetch <= 0) msToFirstFetch += 5 * 60 * 1000;

                timeout = setTimeout(() => {
                    fetchIndicatorSeriesData();
                    interval = setInterval(fetchIndicatorSeriesData, 300000);
                }, msToFirstFetch);
                return;
            }

            if (isTrading && hour === 15 && minute <= 40) {
                const currentSecondMs = (second * 1000) + now.getMilliseconds();

                if (minute < 32 || (minute === 32 && currentSecondMs < 1000)) {
                    const msTo332 = ((32 - minute) * 60 * 1000) - currentSecondMs;
                    postClose332 = setTimeout(fetchIndicatorSeriesData, Math.max(msTo332, 0));
                } else if (minute >= 32) {
                    postClose332 = setTimeout(fetchIndicatorSeriesData, 1000);
                }

                if (minute < 40 || (minute === 40 && currentSecondMs < 1000)) {
                    const msTo340 = ((40 - minute) * 60 * 1000) - currentSecondMs;
                    postClose340 = setTimeout(fetchIndicatorSeriesData, Math.max(msTo340, 0));
                }
            }
        };

        scheduleAlignedRefresh();

        return () => {
            clearTimeout(timeout);
            clearTimeout(postClose332);
            clearTimeout(postClose340);
            if (interval) clearInterval(interval);
        };
    }, [showRsi, showMacd, timeframe, stockId, isMarketOpen, fetchIndicatorSeriesData]);

    // Fetch chart data function
    const fetchChartData = useCallback(async (showLoading = true, forceApi = false) => {
        if (!isTimeframeAvailable || !symbol) return;
        if (timeframe === "1D" && !stockId && dayHistory === undefined) return;

        // Use cache for historical timeframes (everything except 1D)
        if (timeframe !== "1D" && chartCache.current[timeframe]) {
            setChartData(chartCache.current[timeframe]);
            setLoading(false);
            return;
        }

        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            if (timeframe === "1D") {
                // If dayHistory prop is provided (controlled mode), use it and skip internal fetch
                // This prevents duplicate API calls when parent already fetches history
                let prices = [];
                let dateStr = targetDate;

                if (dayHistory !== undefined && !forceApi) {
                    // Parent controls data - wait if loading (null/undefined), process if present
                    if (!dayHistory) {
                        // Still loading from parent
                        return;
                    }
                    // Data arrived
                    prices = dayHistory.priceHistory || dayHistory.prices || dayHistory.content || dayHistory || [];

                    // Determine date from data or default to today
                    if (prices.length > 0) {
                        dateStr = prices[0].priceTime.split('T')[0];
                    } else {
                        const now = new Date();
                        dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
                    }
                } else {
                    // Legacy/Standalone mode: Fetch data internally
                    // Determine which date to query based on current time
                    if (!dateStr) {
                        const now = new Date();
                        const istOptions = { timeZone: 'Asia/Kolkata' };
                        const istHour = parseInt(now.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', hour12: false }));
                        const istDate = new Intl.DateTimeFormat('en-CA', istOptions).format(now);
                        const isTodayTradingDay = isTradingDay(now);

                        if (istHour < 9 || !isTodayTradingDay) {
                            try {
                                const lp = await getLatestPrice(stockId);
                                if (lp?.priceTime) dateStr = lp.priceTime.split('T')[0];
                            } catch (e) { }
                            if (!dateStr) dateStr = istDate;
                        } else {
                            dateStr = istDate;
                        }
                        setTargetDate(dateStr);
                    }

                    const startTime = `${dateStr}T09:00:00`;
                    const endTime = `${dateStr}T23:59:59`;

                    // Fetch from database
                    const response = await getPriceHistory(stockId, startTime, endTime);
                    prices = response.priceHistory || response.prices || response.content || response || [];
                }

                // Generate all 76 time slots
                const allSlots = generateTimeSlots(dateStr);
                setTargetDate(dateStr);

                // Map fetched data to slots
                const priceMap = new Map();
                // Store day's opening price if available (from first data point)
                const dayOpenPrice = (prices.length > 0) ? prices[0].openPrice : null;
                // Get the REAL Previous Close from API (Friday's close for chart color)
                const apiPreviousClose = (prices.length > 0) ? prices[0].previousClose : null;

                (Array.isArray(prices) ? prices : []).forEach((item) => {
                    const time = new Date(item.priceTime).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                    });
                    priceMap.set(time, item);
                });

                // This tracks the last slot's close price for candle open calculation (different from API previousClose)
                let lastSlotClose = dayOpenPrice;

                // Fill slots with actual data where available
                const filledSlots = allSlots.map((slot, index) => {
                    const item = priceMap.get(slot.time);
                    const currentPrice = item?.intervalClose ?? item?.price ?? null;
                    const intervalOpen = item?.intervalOpen ?? null;
                    const intervalHigh = item?.intervalHigh ?? null;
                    const intervalLow = item?.intervalLow ?? null;
                    const intervalVolume = item?.intervalVolume ?? null;

                    let open = null;
                    let high = null;
                    let low = null;
                    let close = null;
                    let volume = null;

                    if (currentPrice !== null) {
                        close = currentPrice;
                        volume = intervalVolume ?? item.volume;

                        if (chartType === "candle" && intervalOpen !== null && intervalHigh !== null && intervalLow !== null) {
                            open = intervalOpen;
                            high = intervalHigh;
                            low = intervalLow;
                        } else {
                            // Determine Open
                            if (index === 0 && dayOpenPrice) {
                                open = dayOpenPrice;
                            } else if (lastSlotClose !== null) {
                                open = lastSlotClose;
                            } else {
                                open = close; // Fallback
                            }

                            // Fallback synthetic wick/body when interval OHLC isn't available.
                            high = Math.max(open, close);
                            low = Math.min(open, close);
                        }

                        lastSlotClose = close;
                    }

                    return {
                        ...slot,
                        price: close,
                        previousClose: apiPreviousClose, // Include the REAL previous close from API
                        open: open,
                        high: high,
                        low: low,
                        volume: volume,
                        x: slot.timestamp, // For Chart.js
                    };
                });

                setChartData(filledSlots);
                // We don't strict cache 1D because it updates frequently
            } else {
                // Fetch Yahoo Finance data for other timeframes
                let response;
                if (historicalRangeFetcher) {
                    response = await historicalRangeFetcher(timeframe);
                } else {
                    switch (timeframe) {
                        case "1W": response = await getChartData1W(symbol); break;
                        case "1M": response = await getChartData1M(symbol); break;
                        case "3M": response = await getChartData3M(symbol); break;
                        case "1Y": response = await getChartData1Y(symbol); break;
                        case "3Y": response = await getChartData3Y(symbol); break;
                        default: throw new Error("Invalid timeframe");
                    }
                }

                // Format Yahoo Finance data for chart
                const dataPoints = response?.dataPoints || [];

                const data = dataPoints.map((point) => {
                    const date = new Date(point.time);
                    return {
                        time: formatDateForTimeframe(date, timeframe),
                        timestamp: date.getTime(),
                        x: date.getTime(), // For Chart.js
                        price: point.close,
                        open: point.open,
                        high: point.high,
                        low: point.low,
                        volume: point.volume,
                    };
                });

                setChartData(data);
                chartCache.current[timeframe] = data; // Cache the result
            }
        } catch (err) {
            console.error("Chart data fetch error:", err);
            setError("Failed to load chart data");
            setChartData([]);
        } finally {
            setLoading(false);
        }
    }, [timeframe, chartType, stockId, symbol, isTimeframeAvailable, targetDate, dayHistory]);

    // Live update from WebSocket to animate the active candle
    useEffect(() => {
        if (timeframe !== "1D" || !wsPrice || !isMarketOpen) return;

        setChartData(prevData => {
            if (prevData.length === 0) return prevData;

            const now = new Date();
            // Find slot matching current time (Round down minutes to nearest 5)
            const minutes = now.getMinutes();
            const roundedMinutes = Math.floor(minutes / 5) * 5;
            const slotTime = `${now.getHours().toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;

            const index = prevData.findIndex(d => d.time === slotTime);

            if (index === -1) return prevData;

            const newData = [...prevData];
            const currentSlot = newData[index];
            const livePrice = wsPrice.price;

            // Initialize Open/High/Low if this is the first tick of the slot
            const open = currentSlot.open !== null ? currentSlot.open : livePrice;
            const high = currentSlot.high !== null ? Math.max(currentSlot.high, livePrice) : livePrice;
            const low = currentSlot.low !== null ? Math.min(currentSlot.low, livePrice) : livePrice;

            newData[index] = {
                ...currentSlot,
                price: livePrice,
                open: open,
                high: high,
                low: low,
                // accumulated volume logic would be complex here, keeping existing/null
            };

            return newData;
        });
    }, [wsPrice, timeframe, isMarketOpen]);

    // Format date based on timeframe
    const formatDateForTimeframe = (date, tf) => {
        switch (tf) {
            case "1W": return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
            case "1M":
            case "3M": return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            case "1Y":
            case "3Y": return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
            default: return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchChartData(true);
    }, [stockId, symbol, timeframe, chartType, isTimeframeAvailable]);

    // Immediate refresh when market opens (e.g. 9:14 -> 9:15 transition)
    useEffect(() => {
        if (!disableAutoRefresh && isMarketOpen && timeframe === "1D") {
            fetchChartData(false);
        }
    }, [disableAutoRefresh, isMarketOpen, timeframe, fetchChartData]);

    // Auto-refresh every 5 minutes during market hours to capture new 5-min data points
    // Auto-refresh logic (Market Hours + Final Closing Candle)
    useEffect(() => {
        if (disableAutoRefresh || !isTimeframeAvailable || timeframe !== "1D") return;

        // Function calls fetchChartData silently
        const refreshData = () => fetchChartData(false, true);

        // CASE 1: MARKET IS OPEN
        if (isMarketOpen) {
            // Calculate milliseconds until the next 5-minute boundary + 120 seconds
            const calculateTimeUntilNextFetch = () => {
                const now = new Date();
                const minutes = now.getMinutes();
                const seconds = now.getSeconds();
                const milliseconds = now.getMilliseconds();

                // Frontend sync minute is X:02 for each 5-min cycle (9:17, 9:22, ...)
                // so it pulls after backend X:01 fetch.
                const minutesUntilSync = (2 - (minutes % 5) + 5) % 5;
                let msUntilSync = (minutesUntilSync * 60 * 1000) - (seconds * 1000) - milliseconds;
                if (msUntilSync <= 0) msUntilSync += 5 * 60 * 1000;
                return msUntilSync;
            };

            const timeUntilNextFetch = calculateTimeUntilNextFetch();
            // console.log(`Next chart refresh scheduled in ${Math.round(timeUntilNextFetch/1000)} seconds`);

            const timeout = setTimeout(() => {
                refreshData();
                // After first aligned fetch, switch to interval
                refreshIntervalRef.current = setInterval(refreshData, 300000); // 5 mins
            }, timeUntilNextFetch);

            return () => {
                clearTimeout(timeout);
                if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            };
        }

        // CASE 2: MARKET JUST CLOSED (Final Catch-up)
        else {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            // If we are in the 3:30 PM - 3:40 PM window
            if (hours === 15 && minutes >= 30 && minutes <= 40) {

                // If it is specifically 3:30 PM, wait until 3:32:00 to match the T+120s rule.
                if (minutes === 30 || minutes === 31) {
                    const msToWait = ((32 - minutes) * 60 * 1000) - (seconds * 1000);

                    // console.log(`Market closed. Waiting ${msToWait}ms for final backend sync (3:32:00)`);
                    const finalTimeout = setTimeout(() => {
                        refreshData();
                    }, msToWait);
                    return () => clearTimeout(finalTimeout);
                }
                // If it's already past 3:32:00, fetch now and schedule one more at 3:40 for reconciliation.
                else {
                    const timeoutHandles = [];
                    timeoutHandles.push(setTimeout(() => {
                        refreshData();
                    }, 1000));

                    if (minutes < 40) {
                        const msTo340 = ((40 - minutes) * 60 * 1000) - (seconds * 1000);
                        timeoutHandles.push(setTimeout(() => {
                            refreshData();
                        }, Math.max(msTo340, 0)));
                    }

                    return () => timeoutHandles.forEach((h) => clearTimeout(h));
                }
            }
        }

    }, [disableAutoRefresh, timeframe, isTimeframeAvailable, isMarketOpen, fetchChartData]);

    // Calculate min/max for Y axis
    const yDomain = useMemo(() => {
        if (chartData.length === 0) return ["auto", "auto"];
        const prices = chartData.map((d) => d.high || d.price).filter((p) => p != null); // Use high for max if candle
        const lows = chartData.map((d) => d.low || d.price).filter((p) => p != null); // Use low for min if candle

        if (prices.length === 0) return ["auto", "auto"];

        const min = Math.min(...lows);
        const max = Math.max(...prices);
        const padding = (max - min) * 0.1;
        return [Math.floor(min - padding), Math.ceil(max + padding)];
    }, [chartData]);


    // Prepare Chart.js Data
    const chartJsConfig = useMemo(() => {
        if (chartType !== 'candle' || chartData.length === 0) return null;

        const candleData = chartData
            .filter(d => d.x != null && d.open != null && d.high != null && d.low != null && d.price != null)
            .map(d => ({
                x: d.x,
                o: d.open,
                h: d.high,
                l: d.low,
                c: d.price
            }));

        return {
            datasets: [{
                label: symbol,
                data: candleData,
                color: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                borderColor: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                borderColors: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                wickColor: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                backgroundColor: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                backgroundColors: {
                    up: '#22c55e',
                    down: '#ef4444',
                    unchanged: '#9ca3af',
                },
                // Keep intraday candles visually slim, even when there are fewer points early in session.
                barThickness: 6,
                maxBarThickness: 7,
                categoryPercentage: 0.72,
                barPercentage: 0.88,
            }]
        };

    }, [chartData, chartType, symbol]);

    // Chart.js Options
    // Chart.js Options
    const chartJsOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                min: (timeframe === '1D' && targetDate) ? new Date(`${targetDate}T09:15:00`).getTime() : undefined,
                max: (timeframe === '1D' && targetDate) ? new Date(`${targetDate}T15:30:00`).getTime() : undefined,
                time: {
                    unit: timeframe === '1D' ? 'hour' : 'day',
                    displayFormats: {
                        hour: 'HH:mm',
                        day: 'dd MMM',
                        month: 'MMM yy'
                    },
                    tooltipFormat: 'dd MMM yyyy HH:mm',
                },
                grid: {
                    display: false,
                    borderColor: chartThemeColors.border
                },
                ticks: {
                    color: chartThemeColors.muted,
                    source: 'auto'
                }
            },
            y: {
                position: 'right',
                grid: {
                    display: false,
                    color: chartThemeColors.border,
                    borderColor: chartThemeColors.border
                },
                ticks: {
                    color: chartThemeColors.muted,
                    callback: (value) => `₹${value}`
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (context) => {
                        const p = context.raw;
                        return [
                            `Open: ₹${p.o.toFixed(2)}`,
                            `High: ₹${p.h.toFixed(2)}`,
                            `Low: ₹${p.l.toFixed(2)}`,
                            `Close: ₹${p.c.toFixed(2)}`
                        ];
                    }
                }
            }
        }
    }), [timeframe, targetDate, chartThemeColors]);

    const displayDateLabel = useMemo(() => {
        if (!targetDate) return null;
        const [yyyy, mm, dd] = targetDate.split("-");
        if (!yyyy || !mm || !dd) return targetDate;
        return `${dd}/${mm}/${yyyy}`;
    }, [targetDate]);


    // Custom Recharts tooltip
    const CustomRechartsTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl z-50">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-lg font-bold">₹{data.price?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    {data.high && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <p>O: ₹{data.open?.toFixed(2)} | H: ₹{data.high?.toFixed(2)}</p>
                            <p>L: ₹{data.low?.toFixed(2)} | V: {(data.volume / 1000)?.toFixed(1)}K</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const IndicatorTooltip = ({ active, payload, label, type }) => {
        if (!active || !payload || payload.length === 0) return null;
        const row = payload[0]?.payload || {};

        if (type === "RSI") {
            return (
                <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl z-50">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm font-semibold">RSI: {row.rsi ?? "—"}</p>
                </div>
            );
        }

        return (
            <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl z-50">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm">MACD: {row.macd ?? "—"}</p>
                <p className="text-sm">SIGNAL: {row.macdSignalSeries ?? "—"}</p>
                <p className="text-sm">HIST: {row.macdHistogram ?? "—"}</p>
            </div>
        );
    };

    return (
        <div className="glass-card p-6 space-y-4">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        {isPositive ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-muted-foreground">Price Chart</span>
                    </div>

                    {/* Chart Type Toggle (Mobile aligned to right) */}
                    <div className="flex sm:hidden gap-1 bg-secondary/50 p-1 rounded-lg">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChartType("area")}
                            className={`h-7 w-7 p-0 ${chartType === "area" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                        >
                            <LineChart className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChartType("candle")}
                            className={`h-7 w-7 p-0 ${chartType === "candle" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                        >
                            <BarChart2 className="h-4 w-4 rotate-90" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {/* Timeframe Buttons */}
                    <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg shrink-0">
                        {enabledTimeframes.map((tf) => (
                            <Button
                                key={tf.key}
                                variant={timeframe === tf.key ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setTimeframe(tf.key)}
                                className={`h-7 px-3 text-xs font-medium ${timeframe === tf.key
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tf.label}
                            </Button>
                        ))}
                    </div>

                    {/* Chart Type Toggle (Desktop) */}
                    <div className="hidden sm:flex gap-1 bg-secondary/50 p-1 rounded-lg shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChartType("area")}
                            className={`h-7 w-7 p-0 ${chartType === "area" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                            title="Area Chart"
                        >
                            <LineChart className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setChartType("candle")}
                            className={`h-7 w-7 p-0 ${chartType === "candle" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                            title="Candlestick Chart"
                        >
                            <BarChart2 className="h-4 w-4 rotate-90" />
                        </Button>
                    </div>

                    {/* Indicator Toggles */}
                    <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRsi((prev) => !prev)}
                            aria-pressed={showRsi}
                            className={`h-7 px-3 text-xs font-medium ${showRsi
                                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary/40"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            title="Toggle RSI"
                        >
                            RSI
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMacd((prev) => !prev)}
                            aria-pressed={showMacd}
                            className={`h-7 px-3 text-xs font-medium ${showMacd
                                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-primary/40"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            title="Toggle MACD"
                        >
                            MACD
                        </Button>
                    </div>
                </div>
            </div>

            {timeframe === "1D" && !isTodayTradingDay && displayDateLabel && (
                <p className="text-xs text-muted-foreground">
                    Market holiday/weekend: showing data for {displayDateLabel}
                </p>
            )}

            {/* Chart Area */}
            <div className="space-y-3">
            <div className="h-[400px] w-full relative">
                {!isTimeframeAvailable ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <span className="text-lg font-medium mb-2">Coming Soon</span>
                        <span className="text-sm">Historical data for {timeframe} will be available soon</span>
                    </div>
                ) : loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        {error}
                    </div>
                ) : chartData.length === 0 || filledData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <span className="text-lg font-medium mb-2">
                            {emptyStateTitle || (timeframe === "1D" ? "Market Opens at 9:15 AM" : "No Data Available")}
                        </span>
                        <span className="text-sm">
                            {emptyStateSubtitle || (timeframe === "1D"
                                ? "The 1D chart will populate as trading begins"
                                : "Price data will appear once the scheduler runs")}
                        </span>
                    </div>
                ) : (
                    <>
                        {chartType === 'area' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={chartDataWithIndicators}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorPricePositive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                                        </linearGradient>
                                        <linearGradient id="colorPriceNegative" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.55} />
                                    <ReXAxis dataKey="time" hide={true} />
                                    <ReYAxis
                                        domain={yDomain}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `₹${val}`}
                                        width={60}
                                        orientation="right"
                                    />
                                    <ReTooltip content={<CustomRechartsTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke={isPositive ? "#22c55e" : "#ef4444"}
                                        strokeWidth={2}
                                        fill={isPositive ? "url(#colorPricePositive)" : "url(#colorPriceNegative)"}
                                        dot={false}
                                        activeDot={{ r: 5, strokeWidth: 2, fill: isPositive ? "#22c55e" : "#ef4444" }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full p-2">
                                <ReactChart
                                    type='candlestick'
                                    data={chartJsConfig}
                                    options={chartJsOptions}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {showRsi && !areIndicatorsAvailableForTimeframe && (
                <div className="h-[120px] w-full rounded-lg border border-border/50 bg-card/40 p-3 overflow-hidden flex items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">RSI chart is currently available only for 1D timeframe.</p>
                </div>
            )}

            {isTimeframeAvailable && areIndicatorsAvailableForTimeframe && !loading && !error && filledData.length > 0 && showRsi && (
                <div className="h-[180px] w-full rounded-lg border border-border/50 bg-card/40 p-3 overflow-hidden flex flex-col">
                    <div className="px-1 pb-2 text-sm font-bold tracking-wide text-foreground">RSI (14)</div>
                    <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={chartDataWithIndicators} margin={{ top: 8, right: 12, left: 0, bottom: 2 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                            <ReXAxis dataKey="time" hide={true} />
                            <ReYAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                width={36}
                            />
                            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" />
                            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 4" />
                            <ReTooltip content={<IndicatorTooltip type="RSI" />} />
                            <ReLine
                                type="monotone"
                                dataKey="rsi"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                            />
                        </ReLineChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            )}

            {showMacd && !areIndicatorsAvailableForTimeframe && (
                <div className="h-[120px] w-full rounded-lg border border-border/50 bg-card/40 p-3 overflow-hidden flex items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">MACD chart is currently available only for 1D timeframe.</p>
                </div>
            )}

            {isTimeframeAvailable && areIndicatorsAvailableForTimeframe && !loading && !error && filledData.length > 0 && showMacd && (
                <div className="h-[210px] w-full rounded-lg border border-border/50 bg-card/40 p-3 overflow-hidden flex flex-col">
                    <div className="px-1 pb-2 text-sm font-bold tracking-wide text-foreground">MACD (12, 26, 9)</div>
                    <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartDataWithIndicators} margin={{ top: 8, right: 12, left: 0, bottom: 2 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                            <ReXAxis dataKey="time" hide={true} />
                            <ReYAxis
                                domain={["auto", "auto"]}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                tickLine={false}
                                axisLine={false}
                                width={42}
                            />
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.75} />
                            <ReTooltip content={<IndicatorTooltip type="MACD" />} />
                            <ReBar dataKey="macdHistogram" barSize={4} fill="#60a5fa" isAnimationActive={false} />
                            <ReLine
                                type="monotone"
                                dataKey="macd"
                                stroke="#22c55e"
                                strokeWidth={1.8}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                            />
                            <ReLine
                                type="monotone"
                                dataKey="macdSignalSeries"
                                stroke="#ef4444"
                                strokeWidth={1.8}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
