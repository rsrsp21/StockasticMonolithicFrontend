import { useState, useEffect, useMemo } from 'react';
import { ordersApi } from '../api/ordersApi';
import { walletApi } from '../api/walletApi';
import { useMultipleStocksWebSocket } from './useMultipleStocksWebSocket';
import { isMarketOpen as checkMarketStatus } from '../utils/marketUtils';
import { getChartData1M } from '../services/stockPriceService';

/**
 * Hook to manage portfolio/holdings data with real-time price updates.
 * Fetches holdings from API and subscribes to WebSocket for live prices during market hours.
 */
export function usePortfolioData({ enableWebSocket = true } = {}) {
    const [holdings, setHoldings] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMarketOpen, setIsMarketOpen] = useState(false);

    // Fetch initial data
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Check market status locally using utils
            const marketOpen = checkMarketStatus();
            setIsMarketOpen(marketOpen);

            const [holdingsData, walletData] = await Promise.all([
                ordersApi.getHoldings(),
                walletApi.getWallet()
            ]);
            setHoldings(holdingsData || []);
            setWallet(walletData);
        } catch (err) {
            console.error("Failed to fetch portfolio data:", err);
            setError("Failed to load portfolio data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Set interval to check market status every minute
        const interval = setInterval(() => {
            setIsMarketOpen(checkMarketStatus());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Extract stock IDs for WebSocket subscription
    const stockIds = useMemo(() => 
        holdings.map(h => h.stockId).filter(Boolean),
        [holdings]
    );

    // Subscribe to live prices only during market hours AND if enabled
    const { prices: livePrices, connected: wsConnected } = useMultipleStocksWebSocket(
        stockIds,
        isMarketOpen && stockIds.length > 0 && enableWebSocket
    );

    // Merge holdings with live prices
    const enrichedHoldings = useMemo(() => {
        return holdings.map(holding => {
            const livePrice = livePrices[holding.stockId];
            
            // Use live price if available, otherwise use API's currentPrice
            const currentPrice = livePrice?.price ?? holding.currentPrice;
            const currentValue = currentPrice * holding.quantity;
            const investedAmount = holding.averagePrice * holding.quantity;
            const profitLoss = currentValue - investedAmount; // Unrealized
            const profitLossPercent = investedAmount > 0 
                ? (profitLoss / investedAmount) * 100 
                : 0;

            // Calculate day change from live data if available, else use API response
            let dayChange, dayChangePercent;
            
            if (livePrice) {
                 // Use previousClose as baseline (market standard), fallback to open
                 const baseline = livePrice.previousClose || livePrice.open;
                 
                 if (baseline) {
                    dayChange = currentPrice - baseline;
                    dayChangePercent = baseline > 0 
                        ? (dayChange / baseline) * 100 
                        : 0;
                 } else {
                    dayChange = 0;
                    dayChangePercent = 0;
                 }
            } else {
                 // Fallback to backend data (latest closing data)
                 dayChange = holding.dayChange ?? 0;
                 dayChangePercent = holding.dayChangePercent ?? 0;
            }

            // Realized P&L from backend (lifetime for this holding)
            const realizedPnl = holding.realizedPnl || 0;
            
            // Total P&L = Realized + Unrealized
            const totalPnl = profitLoss + realizedPnl;

            return {
                ...holding,
                currentPrice,
                currentValue,
                investedAmount,
                profitLoss, // Unrealized
                profitLossPercent, // Unrealized %
                realizedPnl,
                totalPnl,
                dayChange,
                dayChangePercent,
                isLive: !!livePrice
            };
        });
    }, [holdings, livePrices]);

    // Calculate portfolio summary
    const portfolioSummary = useMemo(() => {
        const totals = enrichedHoldings.reduce((acc, h) => ({
            totalInvested: acc.totalInvested + (h.investedAmount || 0),
            currentValue: acc.currentValue + (h.currentValue || 0),
            totalUnrealizedPnl: acc.totalUnrealizedPnl + (h.profitLoss || 0),
            totalRealizedPnl: acc.totalRealizedPnl + (h.realizedPnl || 0),
            totalPnl: acc.totalPnl + (h.totalPnl || 0),
            dayPnl: acc.dayPnl + ((h.dayChange || 0) * h.quantity)
        }), { totalInvested: 0, currentValue: 0, totalUnrealizedPnl: 0, totalRealizedPnl: 0, totalPnl: 0, dayPnl: 0 });

        const pnlPercent = totals.totalInvested > 0 
            ? (totals.totalPnl / totals.totalInvested) * 100 
            : 0;
        
        const dayPnlPercent = (totals.currentValue - totals.dayPnl) > 0
            ? (totals.dayPnl / (totals.currentValue - totals.dayPnl)) * 100
            : 0;

        return {
            ...totals,
            pnlPercent,
            dayPnlPercent,
            isPositive: totals.totalPnl >= 0,
            isDayPositive: totals.dayPnl >= 0
        };
    }, [enrichedHoldings]);

    return {
        holdings: enrichedHoldings,
        wallet,
        isLoading,
        error,
        isMarketOpen,
        wsConnected,
        portfolioSummary,
        portfolioSummary,
        refetch: fetchData,
        // chartData,
       // isLoadingChart
    };
}
