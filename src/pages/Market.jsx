/**
 * Market Page - Shows top gainers, losers, most traded, and recently visited stocks
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTopGainers, getTopLosers, getMostTraded, getLatestPrices } from '../api/stockApi';
import { TrendingUp, TrendingDown, Clock, Flame, Activity, BadgeCheck } from 'lucide-react';
import { StockCard } from '../components/market/StockCard';
import { CompactStockCard } from '../components/market/CompactStockCard';
import { FeaturedStockCard } from '../components/market/FeaturedStockCard';
import { MarketSection } from '../components/market/MarketSection';
import { StockCardSkeleton, CompactStockCardSkeleton, FeaturedSkeleton } from '../components/market/MarketSkeletons';
import { usePageTitle } from '../hooks/usePageTitle';
import { Button } from '../components/ui/button';
import { RefreshButton } from '../components/common/RefreshButton';

const RECENTLY_VISITED_KEY = 'stockastic_recently_visited';

const Market = () => {
    usePageTitle("Market Overview");
    const navigate = useNavigate();
    const [recentlyVisited, setRecentlyVisited] = useState([]);

    const {
        data: gainers = [],
        isLoading: isGainersLoading,
        isFetching: isGainersFetching,
        isError: isGainersError,
        error: gainersError,
        refetch: refetchGainers
    } = useQuery({
        queryKey: ['marketGainers', 5],
        queryFn: () => getTopGainers(5),
        staleTime: 30_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false
    });

    const {
        data: losers = [],
        isLoading: isLosersLoading,
        isFetching: isLosersFetching,
        isError: isLosersError,
        error: losersError,
        refetch: refetchLosers
    } = useQuery({
        queryKey: ['marketLosers', 5],
        queryFn: () => getTopLosers(5),
        staleTime: 30_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false
    });

    const {
        data: mostTraded = [],
        isLoading: isMostTradedLoading,
        isFetching: isMostTradedFetching,
        isError: isMostTradedError,
        error: mostTradedError,
        refetch: refetchMostTraded
    } = useQuery({
        queryKey: ['marketMostTraded', 3],
        queryFn: () => getMostTraded(3),
        staleTime: 30_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false
    });

    const {
        data: latestSnapshots = [],
        isLoading: isLatestSnapshotsLoading,
        isFetching: isLatestSnapshotsFetching,
        refetch: refetchLatestSnapshots
    } = useQuery({
        queryKey: ['marketLatestSnapshots'],
        queryFn: getLatestPrices,
        staleTime: 30_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false
    });

    const loading = isGainersLoading || isLosersLoading || isMostTradedLoading;
    const isFetching = isGainersFetching || isLosersFetching || isMostTradedFetching || isLatestSnapshotsFetching;
    const isError = isGainersError || isLosersError || isMostTradedError;
    const error = gainersError || losersError || mostTradedError;

    const strongBuyIdeas = latestSnapshots
        .filter((stock) => ['STRONG BUY', 'BUY'].includes(stock.finalVerdict))
        .sort((a, b) => {
            const verdictRank = (verdict) => (verdict === 'STRONG BUY' ? 2 : verdict === 'BUY' ? 1 : 0);
            const verdictDiff = verdictRank(b.finalVerdict) - verdictRank(a.finalVerdict);
            if (verdictDiff !== 0) return verdictDiff;
            const volumeDiff = (b.volume || 0) - (a.volume || 0);
            if (volumeDiff !== 0) return volumeDiff;
            const changeDiff = (b.changePercent || 0) - (a.changePercent || 0);
            if (changeDiff !== 0) return changeDiff;
            return (a.symbol || '').localeCompare(b.symbol || '');
        })
        .slice(0, 5);

    useEffect(() => {
        loadRecentlyVisited();
    }, []);

    const loadRecentlyVisited = () => {
        try {
            const stored = localStorage.getItem(RECENTLY_VISITED_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setRecentlyVisited(parsed.slice(0, 5));
            }
        } catch (err) {
            console.error('Error loading recently visited:', err);
        }
    };

    const handleStockClick = (stockId) => {
        navigate(`/stock/${stockId}`);
    };

    const refetchMarketData = async () => {
        await Promise.all([refetchGainers(), refetchLosers(), refetchMostTraded(), refetchLatestSnapshots()]);
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="h-7 w-7 text-primary" />
                            Market Overview
                        </h1>
                        <p className="text-muted-foreground">
                            Discover top performing and trending stocks
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-500/10 text-slate-600 border-slate-500/20">
                            <Activity className="h-3 w-3" />
                            Snapshot View
                        </div>
                        <Button onClick={() => navigate('/explore')} variant="outline" size="sm" className="gap-2">
                            <TrendingUp className="h-4 w-4" /> Explore Stocks
                        </Button>
                        <RefreshButton
                            onClick={refetchMarketData}
                            isLoading={isFetching}
                            size="sm"
                        />
                    </div>
                </div>

                {isError && (
                    <div className="bg-destructive/10 border border-destructive/25 rounded-xl p-4 text-destructive">
                        {error?.message || 'Failed to load market data. Please try again.'}
                    </div>
                )}

                {/* Strong Buy Ideas */}
                <MarketSection
                    icon={BadgeCheck}
                    title="Strong Buy Today"
                    iconColor="text-success"
                    iconBg="bg-gradient-to-br from-success/20 to-success/5"
                    description="Indicator-based buy ideas from current technical verdicts"
                >
                    {isLatestSnapshotsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => <CompactStockCardSkeleton key={i} />)}
                        </div>
                    ) : strongBuyIdeas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {strongBuyIdeas.map((stock) => (
                                <CompactStockCard
                                    key={stock.stockId}
                                    stock={stock}
                                    onClick={() => handleStockClick(stock.stockId)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No buy-side candidates right now based on current technical verdicts.
                        </div>
                    )}
                </MarketSection>

                {/* Recently Visited Section */}
                {recentlyVisited.length > 0 && (
                    <MarketSection
                        icon={Clock}
                        title="Recently Visited"
                        iconColor="text-primary"
                        iconBg="bg-gradient-to-br from-primary/20 to-primary/5"
                        description="Stocks you've recently viewed"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {recentlyVisited.map((stock) => (
                                <CompactStockCard
                                    key={stock.stockId}
                                    stock={stock}
                                    onClick={() => handleStockClick(stock.stockId)}
                                />
                            ))}
                        </div>
                    </MarketSection>
                )}

                {/* Most Traded Section */}
                <MarketSection
                    icon={Flame}
                    title="Most Traded"
                    iconColor="text-warning"
                    iconBg="bg-gradient-to-br from-warning/20 to-warning/10"
                    description="Stocks with highest trading activity"
                >
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => <FeaturedSkeleton key={i} />)}
                        </div>
                    ) : mostTraded.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {mostTraded.map((stock) => (
                                <FeaturedStockCard
                                    key={stock.stockId}
                                    stock={stock}
                                    onClick={() => handleStockClick(stock.stockId)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No trading activity yet. Place some orders to see them here!
                        </div>
                    )}
                </MarketSection>

                {/* Gainers & Losers Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Gainers */}
                    <MarketSection
                        icon={TrendingUp}
                        title="Top Gainers"
                        iconColor="text-success"
                        iconBg="bg-gradient-to-br from-success/20 to-success/5"
                    >
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => <StockCardSkeleton key={i} />)}
                            </div>
                        ) : gainers.length > 0 ? (
                            <div className="space-y-3">
                                {gainers.map((stock) => (
                                    <StockCard
                                        key={stock.stockId}
                                        stock={stock}
                                        type="gainer"
                                        onClick={() => handleStockClick(stock.stockId)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-6">No gainers data available.</p>
                        )}
                    </MarketSection>

                    {/* Top Losers */}
                    <MarketSection
                        icon={TrendingDown}
                        title="Top Losers"
                        iconColor="text-destructive"
                        iconBg="bg-gradient-to-br from-destructive/20 to-destructive/5"
                    >
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => <StockCardSkeleton key={i} />)}
                            </div>
                        ) : losers.length > 0 ? (
                            <div className="space-y-3">
                                {losers.map((stock) => (
                                    <StockCard
                                        key={stock.stockId}
                                        stock={stock}
                                        type="loser"
                                        onClick={() => handleStockClick(stock.stockId)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-6">No losers data available.</p>
                        )}
                    </MarketSection>
                </div>
            </div>
        </>
    );
};

export default Market;
