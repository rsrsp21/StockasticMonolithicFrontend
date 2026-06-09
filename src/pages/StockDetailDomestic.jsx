/**
 * Stock Detail Page
 * Displays comprehensive stock information with real-time updates
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { StockChart } from "../components/stocks/StockChart";
import { AddToWatchlistModal } from "../components/watchlist/AddToWatchlistModal";
import { BuySellModal } from "../components/orders/BuySellModal";
import { SkeletonStockDetail } from "../components/ui/skeleton";
import { StatCard } from "../components/ui/StatCard";
import { PriceAlertModal } from "../components/stocks/PriceAlertModal";
import { AutoSellModal } from "../components/stocks/AutoSellModal";
import { SipModal } from "../components/sip/SipModal";
import { useQuery } from "@tanstack/react-query";
import { useStockRealtimeData } from "../hooks/useStockRealtimeData";
import { API_ENDPOINTS } from "../utils/constants/endpoints";
import { MESSAGES } from "../utils/constants/messages";
import { ordersApi } from "../api/ordersApi";
import { HoldingsCard } from "../components/orders/HoldingsCard";
import * as watchlistService from "../services/watchlistService";
import { getSipsByStock } from "../services/sipService";
import { toast } from "sonner";
import { usePageTitle } from "../hooks/usePageTitle";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "../components/ui/accordion";
import {
    ArrowLeft, TrendingUp, TrendingDown, Wifi, WifiOff, Star, Share2, Bell,
    BarChart3, Briefcase, Activity, Clock, Building2, Zap, Cpu
} from "lucide-react";

export default function StockDetail() {
    const { stockId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role } = useSelector((state) => state.auth);
    const userId = user?.userId;
    const isAdmin = role === "ROLE_ADMIN";
    const isTradingUser = !!userId && !isAdmin;

    // 1. Logic Hook
    const {
        stock, isLoading, stockError, isMarketOpen, isPostCloseSyncWindow, marketStatusMessage,
        currentPrice, priceChange, priceChangePercent, isPositive, effectiveOpenPrice,
        dayHigh, dayLow, fiftyTwoWeekHigh, fiftyTwoWeekLow, volume, avgVolume, historyData, wsPrice, wsConnected, isKYCApproved,
        rsiValue, rsiVerdict, macdValue, macdSignal, macdVerdict, finalVerdict
    } = useStockRealtimeData(stockId);

    usePageTitle(stock?.symbol ? `${stock.symbol} - ${stock.name}` : "Stock Detail");
    const fromLocation = location.state?.from;
    const navigateBack = () => {
        if (fromLocation?.pathname) {
            navigate(`${fromLocation.pathname}${fromLocation.search || ""}`);
            return;
        }
        navigate(-1);
    };

    // 2. Watchlist Logic (Can also be moved to a hook later)
    const [showWatchlistModal, setShowWatchlistModal] = useState(false);
    const [userWatchlists, setUserWatchlists] = useState([]);
    const [isLoadingWatchlists, setIsLoadingWatchlists] = useState(false);
    const [isInAnyWatchlist, setIsInAnyWatchlist] = useState(false);

    // 3. Trading Modal State
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeOrderType, setTradeOrderType] = useState('BUY');
    const [showSipModal, setShowSipModal] = useState(false);

    // 4. On-demand Data Queries (TanStack Query)
    const {
        data: userHolding,
        isLoading: isFetchingHolding,
        isFetched: hasAttemptedHoldingFetch,
        refetch: refetchHolding
    } = useQuery({
        queryKey: ["holding", stockId, userId],
        queryFn: () => ordersApi.getHoldingByStock(stockId),
        enabled: isTradingUser && !!stockId,
        staleTime: 300000, // 5 minutes cache
    });

    const {
        data: stockSips,
        isLoading: isFetchingSips,
        isFetched: hasAttemptedSipFetch,
        refetch: refetchSips
    } = useQuery({
        queryKey: ["stockSips", stockId, userId],
        queryFn: () => getSipsByStock(stockId),
        enabled: isTradingUser && !!stockId,
        staleTime: 300000, // 5 minutes cache
    });
    const activeStockSips = (stockSips || []).filter((sip) => sip.status === "ACTIVE");

    const checkWatchlistStatus = async () => {
        if (!stockId || !isTradingUser) return;
        try {
            const status = await watchlistService.isStockInUserWatchlists(parseInt(stockId), userId);
            setIsInAnyWatchlist(status);
        } catch (err) {
            console.error("Failed to check watchlist status:", err);
        }
    };

    useEffect(() => {
        checkWatchlistStatus();
    }, [stockId, userId, isTradingUser]);

    // Track recently visited stocks for Market page
    useEffect(() => {
        if (stock && stock.stockId) {
            const RECENTLY_VISITED_KEY = 'stockastic_recently_visited';
            try {
                const stored = localStorage.getItem(RECENTLY_VISITED_KEY);
                let recentlyVisited = stored ? JSON.parse(stored) : [];

                // Remove if already exists (to move to front)
                recentlyVisited = recentlyVisited.filter(s => s.stockId !== stock.stockId);

                // Add to front
                recentlyVisited.unshift({
                    stockId: stock.stockId,
                    symbol: stock.symbol,
                    name: stock.name,
                    image: stock.image,
                    currentPrice: currentPrice,
                    changePercent: priceChangePercent
                });

                // Keep only last 10
                recentlyVisited = recentlyVisited.slice(0, 10);

                localStorage.setItem(RECENTLY_VISITED_KEY, JSON.stringify(recentlyVisited));
            } catch (err) {
                console.error('Error saving recently visited:', err);
            }
        }
    }, [stock, currentPrice, priceChangePercent]);

    const handleShare = async () => {
        if (!stock) return;

        const shareData = {
            title: `${stock.symbol} - ${stock.name}`,
            text: `Check out ${stock.name} (${stock.symbol}) on Stockastic! Current Price: ₹${currentPrice.toLocaleString("en-IN")}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                toast.success("Link copied to clipboard!");
            }
        } catch (err) {
            console.error("Error sharing:", err);
            // Don't show error if user cancelled share
            if (err.name !== 'AbortError') {
                toast.error("Failed to share.");
            }
        }
    };

    const handleOpenWatchlistModal = async () => {
        if (!isTradingUser) {
            toast.error("Please login to add to watchlist");
            navigate("/login");
            return;
        }
        setShowWatchlistModal(true);
        setIsLoadingWatchlists(true);
        try {
            const data = await watchlistService.getUserWatchlistsPaged(userId, 0, 50);
            setUserWatchlists(data.content || []);
        } catch (err) {
            console.error("Failed to load watchlists:", err);
            toast.error(MESSAGES.ERROR.WATCHLIST.LOAD_FAILED);
        } finally {
            setIsLoadingWatchlists(false);
        }
    };

    // Format helpers
    const formatVolume = (vol) => {
        if (!vol) return "—";
        if (vol >= 1e7) return `${(vol / 1e7).toFixed(2)} Cr`;
        if (vol >= 1e5) return `${(vol / 1e5).toFixed(2)} L`;
        if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)} K`;
        return vol.toLocaleString("en-IN");
    };

    if (isLoading) {
        return (
            <>
                <SkeletonStockDetail />
            </>
        );
    }

    if (stockError || !stock) {
        return (
            <>
                <div className="h-[60vh] flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <p className="text-xl text-muted-foreground">{stockError || "Stock not found"}</p>
                        <Button onClick={navigateBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Explore
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Stock Info */}
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon" onClick={navigateBack} className="shrink-0 mt-1">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>

                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center overflow-hidden">
                                {stock.image ? (
                                    <img src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${stock.image}`} alt={stock.symbol} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-primary">{stock.symbol?.charAt(0)}</span>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold">{stock.name}</h1>
                                    <Badge variant="secondary" className="font-mono">{stock.symbol}</Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{stock.exchange}</span>
                                    {stock.sector && (
                                        <><span>•</span><span>{stock.sector}</span></>
                                    )}
                                    <span>•</span>
                                    {isMarketOpen ? (
                                        <span className="flex items-center gap-1 text-positive">
                                            <Wifi className="h-3 w-3" /> Live Market
                                        </span>
                                    ) : isPostCloseSyncWindow ? (
                                        <span className="flex items-center gap-1 text-warning">
                                            <Clock className="h-3 w-3" /> Finalizing close data...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <WifiOff className="h-3 w-3" /> {marketStatusMessage}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 ml-12 lg:ml-0">
                        {isTradingUser && (
                            <Button
                                variant={isInAnyWatchlist ? "secondary" : "outline"}
                                size="sm"
                                className={`gap-2 ${isInAnyWatchlist ? "bg-primary/10 hover:bg-primary/20 border-primary/20" : ""}`}
                                onClick={handleOpenWatchlistModal}
                            >
                                <Star className={`h-4 w-4 ${isInAnyWatchlist ? "fill-primary text-primary" : ""}`} />
                                {isInAnyWatchlist ? "Watchlisted" : "Watchlist"}
                            </Button>
                        )}
                        {isTradingUser && (
                            <PriceAlertModal stockId={parseInt(stockId)} symbol={stock.symbol} currentPrice={currentPrice} />
                        )}
                        {isTradingUser && isKYCApproved && (
                            <AutoSellModal stockId={parseInt(stockId)} symbol={stock.symbol} currentPrice={currentPrice} />
                        )}
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                            <Share2 className="h-4 w-4" /> Share
                        </Button>
                    </div>
                </div>

                {/* Top Section: Price & Market Stats Integrated */}
                <div className="glass-card p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-bold tracking-tight">
                                    ₹{currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </span>
                                <div className={`flex items-center gap-1 text-lg font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                    {effectiveOpenPrice ? (
                                        <>
                                            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                            <span>{isPositive ? "+" : ""}{priceChange.toFixed(2)}</span>
                                            <span className="text-sm">({isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%)</span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {isMarketOpen && wsConnected
                                    ? "Live • Updates about every 3s"
                                    : isPostCloseSyncWindow
                                        ? "Finalizing close data..."
                                        : `Last active ${new Date().toLocaleDateString()}`}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 lg:gap-8 lg:border-l lg:pl-8 border-border/50">
                            <div>
                                <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">Open</p>
                                <p className="text-sm font-bold font-mono">₹{effectiveOpenPrice?.toLocaleString("en-IN") || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">High</p>
                                <p className="text-sm font-bold font-mono text-green-500">₹{dayHigh?.toLocaleString("en-IN") || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">Low</p>
                                <p className="text-sm font-bold font-mono text-red-500">₹{dayLow?.toLocaleString("en-IN") || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">Volume</p>
                                <p className="text-sm font-bold font-mono">{formatVolume(volume)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">Avg Vol</p>
                                <p className="text-sm font-bold font-mono">{formatVolume(avgVolume)}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">52W High</p>
                                <p className="text-sm font-bold font-mono text-green-500">₹{fiftyTwoWeekHigh?.toLocaleString("en-IN") || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">52W Low</p>
                                <p className="text-sm font-bold font-mono text-red-500">₹{fiftyTwoWeekLow?.toLocaleString("en-IN") || "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* LEFT COLUMN: Chart & Indicators */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chart Section */}
                        <div className="animate-fade-in">
                            <StockChart
                                stockId={stockId}
                                symbol={stock.symbol}
                                exchange={stock.exchange}
                                wsPrice={wsPrice}
                                wsConnected={wsConnected}
                                isMarketOpen={isMarketOpen}
                                dayHistory={historyData}
                            />
                        </div>

                        {/* Position & SIPs Accordions (Moved below chart) */}
                        {isTradingUser && (
                            <div className="flex flex-col gap-4 animate-fade-in">
                                {/* Your Position Accordion */}
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                >
                                    <AccordionItem value="position" className="glass-card border-none px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Position</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-4">
                                            {isFetchingHolding ? (
                                                <div className="flex flex-col items-center justify-center p-8 gap-3">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Fetching Holding...</p>
                                                </div>
                                            ) : userHolding ? (
                                                <HoldingsCard
                                                    holding={userHolding}
                                                    onBuy={() => { setTradeOrderType('BUY'); setShowTradeModal(true); }}
                                                    onSell={() => { setTradeOrderType('SELL'); setShowTradeModal(true); }}
                                                />
                                            ) : hasAttemptedHoldingFetch ? (
                                                <div className="text-center p-8">
                                                    <p className="text-sm text-muted-foreground mb-4">No active position for this stock.</p>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-[10px] font-bold uppercase border-primary/20 hover:bg-primary/5"
                                                        onClick={() => { setTradeOrderType('BUY'); setShowTradeModal(true); }}
                                                    >
                                                        Start Building Position
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                {/* Your SIPs Accordion */}
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                >
                                    <AccordionItem value="sips" className="glass-card border-none px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active SIPs</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-4">
                                            {isFetchingSips ? (
                                                <div className="flex flex-col items-center justify-center p-8 gap-3">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Fetching SIPs...</p>
                                                </div>
                                            ) : (activeStockSips.length > 0) ? (
                                                <>
                                                    <div className="flex items-center justify-end mb-4">
                                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-tighter" onClick={() => navigate('/sip')}>
                                                            Manage SIPs
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {activeStockSips.map(sip => (
                                                            <div key={sip.id} className="glass-card p-4 border-l-2 border-l-primary flex justify-between items-center bg-white/5">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{sip.frequency}</span>
                                                                        <Badge variant="outline" className={`text-[10px] px-1 h-4 ${sip.status === 'ACTIVE' ? 'text-green-500 border-green-500/30' : 'text-yellow-500 border-yellow-500/30'}`}>
                                                                            {sip.status}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Qty: <span className="text-foreground font-medium">{sip.quantity}</span> • Next: <span className="text-foreground font-medium">{new Date(sip.nextExecutionDate).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold">₹{(sip.quantity * currentPrice).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : hasAttemptedSipFetch ? (
                                                <div className="text-center p-8">
                                                    <p className="text-sm text-muted-foreground mb-4">No active SIPs for {stock.symbol}.</p>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-[10px] font-bold uppercase border-primary/20 hover:bg-primary/5"
                                                        onClick={() => setShowSipModal(true)}
                                                    >
                                                        Start SIP
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        )}

                    </div>

                    {/* RIGHT COLUMN: Trade Buttons & About */}
                    <div className="space-y-6">
                        {/* Trading Actions (No Title) */}
                        <div className="glass-card p-4 space-y-3">
                            <Button
                                size="lg"
                                variant="secondary"
                                className={`w-full gap-2 !text-white font-semibold text-base h-12 !bg-green-600 hover:!bg-green-700 !shadow-none ${!isKYCApproved ? 'cursor-not-allowed opacity-50 !pointer-events-auto' : ''}`}
                                onClick={() => {
                                    if (!isTradingUser) { toast.error("Please login to trade"); navigate("/login"); return; }
                                    setTradeOrderType('BUY'); setShowTradeModal(true);
                                }}
                                disabled={!isTradingUser || !isKYCApproved}
                            >
                                Buy {stock.symbol}
                            </Button>
                            <Button
                                size="lg"
                                variant="secondary"
                                className={`w-full gap-2 !text-white font-semibold text-base h-12 !bg-red-600 hover:!bg-red-700 !shadow-none ${!isKYCApproved ? 'cursor-not-allowed opacity-50 !pointer-events-auto' : ''}`}
                                onClick={() => {
                                    if (!isTradingUser) { toast.error("Please login to trade"); navigate("/login"); return; }
                                    setTradeOrderType('SELL'); setShowTradeModal(true);
                                }}
                                disabled={!isTradingUser || !isKYCApproved}
                            >
                                Sell {stock.symbol}
                            </Button>
                            <Button
                                size="lg"
                                className={`w-full gap-2 text-white font-semibold text-base h-12 bg-gradient-to-r from-[#192B37] to-[#30404B] hover:from-[#30404B] hover:to-[#47555F] border border-[#47555F]/30 ${!isKYCApproved ? 'cursor-not-allowed opacity-50 !pointer-events-auto' : ''}`}
                                onClick={() => {
                                    if (!isTradingUser) { toast.error("Please login to start SIP"); navigate("/login"); return; }
                                    setShowSipModal(true);
                                }}
                                disabled={!isTradingUser || !isKYCApproved}
                            >
                                Start SIP
                            </Button>
                        </div>

                        {/* Stock Description */}
                        {stock.description && (
                            <div className="glass-card p-6 border-l-2 border-l-primary/30">
                                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    About {stock.name}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{stock.description}</p>
                            </div>
                        )}

                        {/* Technical Indicators (Moved from Left Column) */}
                        <div className="animate-fade-in space-y-4">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Technical Analysis</h3>
                                {finalVerdict && (
                                    <Badge className={`ml-auto ${finalVerdict.includes('BUY') ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        finalVerdict.includes('SELL') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        {finalVerdict}
                                    </Badge>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="glass-card p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">RSI (14)</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold">{rsiValue?.toFixed(2) || "—"}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rsiVerdict === 'BULLISH' ? 'bg-green-500/10 text-green-500' :
                                                rsiVerdict === 'BEARISH' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                {rsiVerdict || "NEUTRAL"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-1 bg-muted rounded-full relative overflow-hidden">
                                        <div
                                            className="absolute bottom-0 w-full bg-primary transition-all duration-500"
                                            style={{ height: `${rsiValue || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="glass-card p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm text-muted-foreground">MACD (12, 26, 9)</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${macdVerdict === 'BULLISH' ? 'bg-green-500/10 text-green-500' :
                                            macdVerdict === 'BEARISH' ? 'bg-red-500/10 text-red-500' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                            {macdVerdict || "NEUTRAL"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-lg font-bold">{macdValue?.toFixed(2) || "—"}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Value</p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-border" />
                                        <div>
                                            <p className="text-lg font-bold">{macdSignal?.toFixed(2) || "—"}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signal</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className={`text-sm font-semibold ${(macdValue - macdSignal) >= 0 ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                {(macdValue - macdSignal)?.toFixed(2) || "0.00"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hist</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add to Watchlist Modal */}
            <AddToWatchlistModal
                isOpen={showWatchlistModal}
                stockId={parseInt(stockId)}
                stockName={stock.name}
                stockSymbol={stock.symbol}
                onClose={() => {
                    setShowWatchlistModal(false);
                    checkWatchlistStatus();
                }
                }
                watchlists={userWatchlists}
                isLoading={isLoadingWatchlists}
                userId={isTradingUser ? userId : null}
            />

            {/* Buy/Sell Modal */}
            <BuySellModal
                isOpen={showTradeModal}
                onOpenChange={setShowTradeModal}
                stock={stock}
                currentPrice={currentPrice}
                isMarketOpen={isMarketOpen}
                orderType={tradeOrderType}
                onSuccess={() => {
                    toast.success(MESSAGES.SUCCESS.ORDER.PLACED);
                    refetchHolding(); // Refresh holding for this stock
                }}
                holdingQuantity={userHolding?.quantity || 0}
            />

            <SipModal
                isOpen={showSipModal}
                onClose={() => {
                    setShowSipModal(false);
                    refetchSips(); // Refresh SIPs after modal close (in case created)
                }}
                stock={stock}
                currentPrice={currentPrice}
            />
        </>
    );
}
