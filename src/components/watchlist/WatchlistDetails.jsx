import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, TrendingUp, Plus, Loader2, Package, Building2, Trash2, Settings, Edit, ArrowUp, ArrowDown } from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { Button } from "../ui/button";
import { Pagination } from "../common/Pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useMultipleStocksWebSocket } from "../../hooks/useMultipleStocksWebSocket";
import { isMarketOpen as checkMarketOpen, getMillisecondsUntilNextMarketChange } from "../../utils/marketUtils";

const PAGE_SIZE = 10;

export function WatchlistDetails({
    selectedWatchlist,
    watchlistStocks,
    stocksLoading,
    stocksPage,
    stocksTotalPages,
    stocksTotalElements,
    onAddStockClick,
    onRemoveStock,
    onPageChange,
    onEditClick,
    onDeleteClick,
}) {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState("");
    const [sortDir, setSortDir] = useState("asc");

    // Dynamic Market Status
    const [isMarketOpen, setIsMarketOpen] = useState(checkMarketOpen());

    useEffect(() => {
        let timer;
        const checkAndScheduleNext = () => {
            const open = checkMarketOpen();
            setIsMarketOpen(open);
            // Schedule next check exactly when market state will change
            const msUntilChange = getMillisecondsUntilNextMarketChange();
            if (msUntilChange !== null) {
                timer = setTimeout(checkAndScheduleNext, msUntilChange);
            }
        };
        checkAndScheduleNext();
        return () => clearTimeout(timer);
    }, []);

    // Extract stock IDs for WebSocket subscription
    const stockIds = useMemo(() => {
        if (!watchlistStocks) return [];
        return watchlistStocks.map(item => item.stock?.stockId).filter(Boolean);
    }, [watchlistStocks]);

    // Connect to WebSocket for these stocks
    // Only connect if market is open (matching Explore logic)
    const { prices: livePrices, connected } = useMultipleStocksWebSocket(stockIds, isMarketOpen);

    if (!selectedWatchlist) {
        return (
            <div className="glass-card p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                    <TrendingUp className="h-20 w-20 text-primary/50 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground mt-6 mb-2">
                    Start by selecting a Watchlist
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                    Select a watchlist from the tabs above to view details
                </p>
            </div>
        );
    }

    // Helper to get stock data (merging static + live)
    const getStockData = (item) => {
        const staticStock = item?.stock || {};
        const liveData = livePrices[staticStock.stockId];

        // Merge logic: prefer live data if available
        return {
            ...staticStock,
            currentPrice: liveData?.price ?? staticStock.currentPrice,
            changePercent: liveData?.changePercent ?? staticStock.changePercent,
            volume: liveData?.volume ?? staticStock.volume
        };
    };

    const sortedWatchlistStocks = useMemo(() => {
        const toNumber = (value) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        const getComparable = (stock, key) => {
            switch (key) {
                case "name":
                case "symbol":
                case "exchange":
                case "sector":
                    return String(stock?.[key] ?? "").toLowerCase();
                case "currentPrice":
                case "changePercent":
                case "volume":
                    return toNumber(stock?.[key]);
                default:
                    return "";
            }
        };

        const rows = [...watchlistStocks];
        if (!sortBy) {
            return rows;
        }

        return rows.sort((a, b) => {
            const stockA = getStockData(a);
            const stockB = getStockData(b);
            const aVal = getComparable(stockA, sortBy);
            const bVal = getComparable(stockB, sortBy);

            let comparison;
            if (typeof aVal === "number" && typeof bVal === "number") {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            return sortDir === "asc" ? comparison : -comparison;
        });
    }, [watchlistStocks, sortBy, sortDir, livePrices]);

    const handleSortChange = (columnKey) => {
        if (sortBy === columnKey) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setSortBy(columnKey);
        setSortDir("desc");
    };

    const renderSortHeader = (label, columnKey, align = "left") => {
        const isActive = sortBy === columnKey;
        const isAsc = sortDir === "asc";

        return (
            <button
                type="button"
                onClick={() => handleSortChange(columnKey)}
                className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${align === "right" ? "ml-auto" : ""}`}
                title={`Sort by ${label}`}
            >
                <span>{label}</span>
                {isActive ? (
                    isAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                    <ArrowUp className="h-3.5 w-3.5 opacity-30" />
                )}
            </button>
        );
    };

    return (
        <div className="space-y-4">
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <FolderOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-foreground">
                                    {selectedWatchlist.name}
                                </h2>
                            </div>
                            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                <span>{selectedWatchlist.description || `${watchlistStocks.length || 0} stocks in this list`}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={onAddStockClick} className="gap-2 shadow-lg shadow-primary/25">
                            <Plus className="h-4 w-4" />
                            Add Stock
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditClick(selectedWatchlist)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDeleteClick(selectedWatchlist)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Stocks Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">{renderSortHeader("Stock", "name")}</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">{renderSortHeader("Symbol", "symbol")}</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">{renderSortHeader("Exchange", "exchange")}</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">{renderSortHeader("Price", "currentPrice", "right")}</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">{renderSortHeader("Change", "changePercent", "right")}</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">{renderSortHeader("Volume", "volume", "right")}</th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">{renderSortHeader("Sector", "sector")}</th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {stocksLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="p-4"><div className="h-10 w-48 bg-secondary rounded" /></td>
                                            <td className="p-4"><div className="h-4 w-12 bg-secondary rounded" /></td>
                                            <td className="p-4"><div className="h-4 w-16 bg-secondary rounded" /></td>
                                            <td className="p-4 text-right"><div className="h-4 w-20 bg-secondary rounded ml-auto" /></td>
                                            <td className="p-4 text-right"><div className="h-4 w-16 bg-secondary rounded ml-auto" /></td>
                                            <td className="p-4 text-right"><div className="h-4 w-24 bg-secondary rounded ml-auto" /></td>
                                            <td className="p-4"><div className="h-4 w-24 bg-secondary rounded" /></td>
                                            <td className="p-4 text-right"><div className="h-8 w-20 bg-secondary rounded ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : watchlistStocks.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Package className="h-12 w-12 text-muted-foreground/50" />
                                                <div>
                                                    <p className="font-medium text-foreground">No stocks in {selectedWatchlist.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Add stocks to start tracking them
                                                    </p>
                                                </div>
                                                <Button onClick={onAddStockClick} variant="outline" className="gap-2 mt-2" size="sm">
                                                    <Plus className="h-4 w-4" />
                                                    Add Stock
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedWatchlistStocks.map((item) => {
                                        const stock = getStockData(item);
                                        return (
                                            <tr
                                                key={item.watchlistItemId}
                                                className="hover:bg-secondary/30 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/stock/${stock.stockId}`)}
                                            >
                                                {/* Stock Info */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {stock.image ? (
                                                            <div className="w-10 h-10 rounded-md bg-white border border-border flex-shrink-0">
                                                                <img
                                                                    src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${stock.image}`}
                                                                    alt={stock.name}
                                                                    className="w-full h-full object-contain rounded-md"
                                                                />
                                                            </div >
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                <Building2 className="h-5 w-5 text-primary" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-foreground">{stock.name || "Unknown"}</p>
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {stock.description || "No description"}
                                                            </p>
                                                        </div>
                                                    </div >
                                                </td >

                                                {/* Symbol */}
                                                < td className="p-4" >
                                                    <span className="font-mono text-sm font-semibold text-primary">
                                                        {stock.symbol || "-"}
                                                    </span>
                                                </td >

                                                {/* Exchange */}
                                                < td className="p-4" >
                                                    <span className="text-sm text-foreground">{stock.exchange || "-"}</span>
                                                </td >

                                                {/* Price */}
                                                < td className="p-4 text-right" >
                                                    <div className="font-mono text-sm font-medium transition-all duration-300">
                                                        {stock.currentPrice
                                                            ? stock.currentPrice.toLocaleString("en-IN", {
                                                                style: "currency",
                                                                currency: "INR",
                                                            })
                                                            : "-"}
                                                    </div>
                                                </td >

                                                {/* Change */}
                                                < td className="p-4 text-right" >
                                                    {
                                                        stock.changePercent !== undefined && stock.changePercent !== null ? (
                                                            <span
                                                                className={`text-sm font-medium font-mono ${stock.changePercent >= 0
                                                                    ? "text-positive-dark"
                                                                    : "text-negative-dark"
                                                                    }`}
                                                            >
                                                                {stock.changePercent > 0 ? "+" : ""}
                                                                {stock.changePercent.toFixed(2)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )
                                                    }
                                                </td >

                                                {/* Volume */}
                                                < td className="p-4 text-right" >
                                                    <span className="text-sm text-foreground font-mono">
                                                        {stock.volume ? stock.volume.toLocaleString("en-IN") : "-"}
                                                    </span>
                                                </td >

                                                {/* Sector */}
                                                < td className="p-4" >
                                                    <span className="text-sm text-muted-foreground">
                                                        {stock.sector || "-"}
                                                    </span>
                                                </td >

                                                {/* Action */}
                                                < td className="p-4" >
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRemoveStock(stock.stockId);
                                                            }}
                                                            className="text-destructive hover:text-destructive gap-1.5"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </td >
                                            </tr >
                                        );
                                    })
                                )}
                            </tbody >
                        </table >
                    </div >

                    {/* Pagination */}
                    {
                        stocksTotalElements > PAGE_SIZE && (
                            <Pagination
                                currentPage={stocksPage}
                                totalPages={stocksTotalPages}
                                totalElements={stocksTotalElements}
                                pageSize={PAGE_SIZE}
                                onPageChange={onPageChange}
                                isLoading={stocksLoading}
                                itemLabel="stocks"
                            />
                        )
                    }
                </div >
            </div >
        </div >
    );
}
