import { useState, useEffect, useMemo } from "react";
import {
    X,
    Search,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    TrendingDown,
    GitCompare,
    Loader2,
    Package,
    Activity
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { getPublicStocksPaged } from "../services/stockService";
import { getLatestPrice } from "../services/stockPriceService";
import { cn } from "../utils/utils";
import { useMultipleStocksWebSocket } from "../hooks/useMultipleStocksWebSocket";
import { isMarketOpen as checkMarketOpen, getMillisecondsUntilNextMarketChange } from "../utils/marketUtils";
import { usePageTitle } from "../hooks/usePageTitle";

const COMPARE_STOCKS_KEY = 'stockastic_compare_stocks';

const Compare = () => {
    usePageTitle("Compare Stocks");

    const [selectedStocks, setSelectedStocks] = useState(() => {
        try {
            const saved = localStorage.getItem(COMPARE_STOCKS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // Market Status
    const [isMarketOpen, setIsMarketOpen] = useState(false);

    useEffect(() => {
        const checkAndScheduleNext = () => {
            const open = checkMarketOpen();
            setIsMarketOpen(open);
            const msUntilChange = getMillisecondsUntilNextMarketChange();
            if (msUntilChange !== null) {
                setTimeout(checkAndScheduleNext, msUntilChange);
            }
        };
        checkAndScheduleNext();
    }, []);

    // Persist stocks
    useEffect(() => {
        localStorage.setItem(COMPARE_STOCKS_KEY, JSON.stringify(selectedStocks));
    }, [selectedStocks]);

    // WebSocket for Live Data
    const stockIds = useMemo(() => selectedStocks.map(s => s.stockId), [selectedStocks]);
    const { prices: livePrices } = useMultipleStocksWebSocket(stockIds, isMarketOpen);

    // Merge static data with live prices
    const displayStocks = useMemo(() => {
        return selectedStocks.map(stock => {
            const live = livePrices[stock.stockId];
            if (live) {
                return {
                    ...stock,
                    price: live.price,
                    change: live.change || (live.price - stock.previousClose),
                    changePercent: live.changePercent || ((live.price - stock.previousClose) / stock.previousClose * 100),
                    volume: live.volume,
                };
            }
            return stock;
        });
    }, [selectedStocks, livePrices]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoadingSearch(true);
            const response = await getPublicStocksPaged(0, 20, 'symbol', 'asc', searchQuery);
            const availableStocks = response.content.filter(
                stock => !selectedStocks.find(s => s.stockId === stock.stockId)
            );
            setSearchResults(availableStocks);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const addStock = async (stock) => {
        try {
            const priceData = await getLatestPrice(stock.stockId);
            const stockWithPrice = { ...stock, ...priceData };
            setSelectedStocks(prev => {
                if (prev.length >= 3) return prev;
                return [...prev, stockWithPrice];
            });
            setOpen(false);
            setSearchQuery("");
            setSearchResults([]);
        } catch (error) {
            console.error("Failed to add stock", error);
        }
    };

    const removeStock = (stockId) => {
        setSelectedStocks(prev => prev.filter(s => s.stockId !== stockId));
    };

    const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    const renderAddStockCard = () => (
        <div
            onClick={() => { setOpen(true); setSearchQuery(""); setSearchResults([]); }}
            className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/40 rounded-2xl bg-secondary/15 hover:bg-secondary/30 hover:border-primary/50 transition-all cursor-pointer min-h-[400px] animate-fade-in"
        >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <Plus className="h-7 w-7" />
            </div>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">Add Stock</span>
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-[120px]">
                Compare another stock side-by-side
            </p>
        </div>
    );

    const emptySlots = Math.max(0, 3 - selectedStocks.length);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <GitCompare className="h-7 w-7 text-primary" />
                        Compare Stocks
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Select up to 3 stocks to compare metrics side-by-side.
                    </p>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-md w-full p-6 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Add Stock</h2>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-foreground/55" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search by symbol or name..."
                                    className="pl-10 glass-input"
                                    autoFocus
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={loadingSearch || !searchQuery.trim()}
                                className="gap-2"
                            >
                                {loadingSearch ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                Search
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto -mx-2 px-2">
                            {loadingSearch ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="text-muted-foreground mt-3">Searching...</span>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="p-4 bg-secondary/50 rounded-2xl mb-3">
                                        <Package className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-foreground font-medium">
                                        {searchQuery ? "No stocks found" : "Search for stocks"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1 text-center">
                                        {searchQuery ? "Try a different search term" : "Enter a name or symbol and press Search"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {searchResults.map((stock) => (
                                        <div
                                            key={stock.stockId}
                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                                        >
                                            <div>
                                                <p className="font-semibold text-foreground">{stock.name}</p>
                                                <span className="font-mono text-xs font-bold text-primary">
                                                    {stock.symbol}
                                                </span>
                                            </div>
                                            <Button size="sm" onClick={() => addStock(stock)} className="gap-1.5">
                                                <Plus className="h-4 w-4" />
                                                Add
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Labels Column (Desktop Only) */}
                    <div className="hidden lg:flex flex-col h-full bg-card/60 border border-border/40 rounded-2xl">
                        <div className="p-6 pb-2 min-h-[92px] flex items-end">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Metrics</span>
                        </div>
                        <div className="p-6 pt-4 flex-1 space-y-4">
                            <div className="h-12 flex items-center text-sm font-medium text-muted-foreground border-b border-border/30">Current Price</div>
                            <div className="h-12 flex items-center text-sm font-medium text-muted-foreground border-b border-border/30">Change (24h)</div>
                            <div className="h-12 flex items-center text-sm font-medium text-muted-foreground border-b border-border/30">Volume</div>
                            <div className="h-12 flex items-center text-sm font-medium text-muted-foreground border-b border-border/30">Sector</div>
                            <div className="h-12 flex items-center text-sm font-medium text-muted-foreground">Day High/Low</div>
                        </div>
                    </div>

                    {/* Stock Cards */}
                    {displayStocks.map((stock, index) => (
                        <div key={stock.stockId} className="relative group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl border-2 border-background"
                                onClick={() => removeStock(stock.stockId)}
                            >
                                <X className="h-4 w-4" />
                            </Button>

                            <Card className="glass-card h-full border-t-4" style={{ borderColor: COLORS[index % COLORS.length] }}>
                                <CardHeader className="pb-2 min-h-[92px]">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <CardTitle className="text-xl truncate">{stock.symbol}</CardTitle>
                                            <p className="text-xs text-muted-foreground truncate max-w-[120px]" title={stock.name}>{stock.name}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-3 lg:hidden">
                                        <div className="flex justify-between items-center py-1 border-b border-border/30">
                                            <span className="text-muted-foreground text-sm">Price</span>
                                            <span className="font-mono font-bold">₹{stock.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-border/30">
                                            <span className="text-muted-foreground text-sm">Change</span>
                                            <span className={cn("font-mono font-medium", stock.changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                                                {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent?.toFixed(2)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-border/30">
                                            <span className="text-muted-foreground text-sm">Volume</span>
                                            <span className="font-mono font-medium">{stock.volume?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-border/30">
                                            <span className="text-muted-foreground text-sm">Sector</span>
                                            <span className="font-medium text-xs truncate max-w-[120px]">{stock.sector}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-border/30">
                                            <span className="text-muted-foreground text-sm">High / Low</span>
                                            <span className="font-mono font-medium text-xs text-right">₹{stock.dayHigh?.toLocaleString()}<br />₹{stock.dayLow?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="hidden lg:flex flex-col gap-4">
                                        <div className="h-12 flex items-center font-mono font-bold text-lg border-b border-border/30 w-full">₹{stock.price?.toLocaleString()}</div>
                                        <div className={cn("h-12 flex items-center font-mono border-b border-border/30 w-full", stock.changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                                            {stock.changePercent >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                                            {stock.changePercent !== undefined ? stock.changePercent.toFixed(2) : "0.00"}%
                                        </div>
                                        <div className="h-12 flex items-center font-mono border-b border-border/30 w-full">{(stock.volume || 0).toLocaleString()}</div>
                                        <div className="h-12 flex items-center truncate text-sm border-b border-border/30 w-full" title={stock.sector}>{stock.sector}</div>
                                        <div className="h-12 flex items-center font-mono text-xs text-muted-foreground w-full">
                                            H: ₹{stock.dayHigh?.toLocaleString() || '-'} / L: ₹{stock.dayLow?.toLocaleString() || '-'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}

                    {/* Placeholder Add Stock Cards */}
                    {[...Array(emptySlots)].map((_, i) => (
                        <div key={`empty-${i}`} className="animate-in fade-in duration-500" style={{ animationDelay: `${(selectedStocks.length + i) * 100}ms` }}>
                            {renderAddStockCard()}
                        </div>
                    ))}
                </div>

                {selectedStocks.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 animate-fade-in pt-6 border-t border-border/30">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold tracking-tight">Technical Analysis</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="hidden lg:flex flex-col gap-4">
                                <div className="h-24 p-4 glass-card flex items-center bg-secondary/10">
                                    <div>
                                        <p className="font-semibold text-foreground text-sm uppercase tracking-wide opacity-70">RSI (14)</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Relative Strength Index</p>
                                    </div>
                                </div>
                                <div className="h-24 p-4 glass-card flex items-center bg-secondary/10">
                                    <div>
                                        <p className="font-semibold text-foreground text-sm uppercase tracking-wide opacity-70">MACD</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Convergence Divergence</p>
                                    </div>
                                </div>
                                <div className="h-24 p-4 glass-card flex items-center bg-secondary/10">
                                    <div>
                                        <p className="font-semibold text-foreground text-sm uppercase tracking-wide opacity-70">Verdict</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Overall Sentiment</p>
                                    </div>
                                </div>
                            </div>

                            {displayStocks.map((stock, index) => (
                                <div key={`tech-${stock.stockId}`} className="space-y-4">
                                    <div className="lg:hidden font-bold pb-2 border-b border-border/30 text-sm">{stock.symbol} Analysis</div>
                                    <div className="h-24 glass-card p-4 relative overflow-hidden flex flex-col justify-center border-t-4" style={{ borderColor: COLORS[index % COLORS.length] }}>
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="lg:hidden text-[10px] text-muted-foreground uppercase tracking-wider">RSI</span>
                                            <span className="text-xl font-bold">{stock.rsiValue?.toFixed(2) || "—"}</span>
                                            <Badge variant="outline" className={cn("text-[10px] h-5",
                                                stock.rsiVerdict === 'BULLISH' ? "text-green-500 border-green-500/20 bg-green-500/10" :
                                                    stock.rsiVerdict === 'BEARISH' ? "text-red-500 border-red-500/20 bg-red-500/10" : "text-yellow-500 border-yellow-500/20 bg-yellow-500/10"
                                            )}>{stock.rsiVerdict || "NEUTRAL"}</Badge>
                                        </div>
                                        <div className="w-full bg-secondary/30 h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(stock.rsiValue || 0, 100)}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="h-24 glass-card p-4 flex flex-col justify-center">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="lg:hidden text-[10px] text-muted-foreground uppercase tracking-wider">MACD</span>
                                            <span className={cn("font-bold font-mono", (stock.macdValue - stock.macdSignal) >= 0 ? "text-green-500" : "text-red-500")}>
                                                {(stock.macdValue - stock.macdSignal)?.toFixed(2) || "0.00"}
                                            </span>
                                            <Badge variant="outline" className={cn("text-[10px] h-5",
                                                stock.macdVerdict === 'BULLISH' ? "text-green-500 border-green-500/20 bg-green-500/10" :
                                                    stock.macdVerdict === 'BEARISH' ? "text-red-500 border-red-500/20 bg-red-500/10" : "text-yellow-500 border-yellow-500/20 bg-yellow-500/10"
                                            )}>{stock.macdVerdict || "NEUTRAL"}</Badge>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Val: {stock.macdValue?.toFixed(2) || "-"}</span>
                                            <span>Sig: {stock.macdSignal?.toFixed(2) || "-"}</span>
                                        </div>
                                    </div>

                                    <div className="h-24 glass-card p-4 flex items-center justify-center bg-gradient-to-br from-secondary/20 to-transparent">
                                        <Badge className={cn("text-xs px-3 py-1",
                                            (stock.finalVerdict || "").includes('BUY') ? "bg-green-500 hover:bg-green-600" :
                                                (stock.finalVerdict || "").includes('SELL') ? "bg-red-500 hover:bg-red-600" : "bg-yellow-500 hover:bg-yellow-600 text-black"
                                        )}>
                                            {stock.finalVerdict || "NEUTRAL"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}

                            {/* Technical Analysis Placeholders */}
                            {[...Array(emptySlots)].map((_, i) => (
                                <div key={`tech-empty-${i}`} className="hidden lg:flex flex-col gap-4 h-full">
                                    <div className="h-24 border border-dashed border-border/30 rounded-xl bg-secondary/15 opacity-50" />
                                    <div className="h-24 border border-dashed border-border/30 rounded-xl bg-secondary/15 opacity-50" />
                                    <div className="h-24 border border-dashed border-border/30 rounded-xl bg-secondary/15 opacity-50" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Compare;
