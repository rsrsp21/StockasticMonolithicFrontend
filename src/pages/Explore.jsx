import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, X, Loader2, TrendingUp, ArrowUp, ArrowDown, Wifi } from "lucide-react";
import { RefreshButton } from "../components/common/RefreshButton";

// Components
import { StockTable } from "../components/common/StockTable";
import { StockFilters } from "../components/common/StockFilters";
import { FILTER_DEFAULTS } from "../utils/constants";
import { Pagination } from "../components/common/Pagination";

// Service
import { getPublicStocksPaged } from "../services/stockService";
import { toast } from "sonner";
import { useMultipleStocksWebSocket } from "../hooks/useMultipleStocksWebSocket";
import { isMarketOpen as checkMarketOpen, getMillisecondsUntilNextMarketChange } from "../utils/marketUtils";
import { usePageTitle } from "../hooks/usePageTitle";
import { cn } from "../utils/utils";

const PAGE_SIZE = 10;
const EMPTY_FILTERS = {
    sector: "",
    exchange: "",
    minPrice: "",
    maxPrice: "",
    minVolume: "",
    maxVolume: ""
};

const FILTER_PARAM_KEYS = ["sector", "exchange", "minPrice", "maxPrice", "minVolume", "maxVolume"];
const SERVER_SORTABLE_COLUMNS = new Set(["name", "symbol", "exchange", "sector"]);
const CLIENT_SORTABLE_COLUMNS = new Set(["currentPrice", "changePercent", "volume"]);

const parseFiltersFromParams = (params) => {
    const parsed = {};
    FILTER_PARAM_KEYS.forEach((key) => {
        const value = params.get(key);
        if (value !== null && value !== "") {
            parsed[key] = value;
        }
    });
    return parsed;
};

export default function Explore() {
    usePageTitle("Explore Stocks");
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchParamsSnapshot = searchParams.toString();

    // URL State
    const currentPage = Math.max(0, parseInt(searchParams.get("explorePage") || "0", 10) || 0);
    const marketType = searchParams.get("market") || "domestic";
    const searchQueryFromParams = searchParams.get("q") || "";
    const sortBy = searchParams.get("sortBy") || "";
    const sortDir = searchParams.get("sortDir") === "desc" ? "desc" : "asc";
    const filtersFromParams = parseFiltersFromParams(searchParams);

    // Local Query/Filter State (to start with)
    const [searchQuery, setSearchQuery] = useState(searchQueryFromParams);
    const [appliedSearch, setAppliedSearch] = useState(searchQueryFromParams);

    // Filter state
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...filtersFromParams });
    const [appliedFilters, setAppliedFilters] = useState(filtersFromParams);

    useEffect(() => {
        setSearchQuery(searchQueryFromParams);
        setAppliedSearch(searchQueryFromParams);
        setFilters({ ...EMPTY_FILTERS, ...filtersFromParams });
        setAppliedFilters(filtersFromParams);
    }, [searchParamsSnapshot]);

    const isServerSortable = SERVER_SORTABLE_COLUMNS.has(sortBy);
    const isClientSortable = CLIENT_SORTABLE_COLUMNS.has(sortBy);
    const apiSortBy = isServerSortable ? sortBy : "symbol";
    const apiSortDir = isServerSortable ? sortDir : "asc";

    // Fetch stocks using React Query
    const {
        data: stocksData,
        isLoading: loading,
        isFetching,
        refetch
    } = useQuery({
        queryKey: ['publicStocks', currentPage, appliedSearch, appliedFilters, marketType, apiSortBy, apiSortDir, sortBy, sortDir],
        queryFn: () => getPublicStocksPaged(
            currentPage,
            PAGE_SIZE,
            apiSortBy,
            apiSortDir,
            appliedSearch,
            appliedFilters,
            marketType
        ),
        keepPreviousData: true,
    });

    const stocks = stocksData?.content || [];
    const totalPages = stocksData?.totalPages || 0;
    const totalElements = stocksData?.totalElements || 0;

    // Market Status & WebSocket
    const [isMarketOpen, setIsMarketOpen] = useState(false);

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
            // If null, no more changes today - no timer needed
        };
        checkAndScheduleNext();
        return () => clearTimeout(timer);
    }, []);

    // Get IDs of currently displayed stocks for subscription
    const visibleStockIds = marketType === "domestic" ? stocks.map(s => s.stockId) : [];

    // Connect to WebSocket for these stocks
    // We enable it only if market is open, or if we want latest-at-connect updates.
    // User requested "websockets if live", so we pass isMarketOpen.
    const { prices: livePrices, connected: wsConnected } = useMultipleStocksWebSocket(visibleStockIds, isMarketOpen);

    // Merge static stock data with live prices
    const displayStocks = stocks.map(stock => {
        const live = livePrices[stock.stockId];

        let displayStock = { ...stock };

        // When market is closed, prefer Average Volume if available
        if (!isMarketOpen && stock.avgVolume) {
            displayStock.volume = stock.avgVolume;
        }

        if (live) {
            return {
                ...displayStock,
                currentPrice: live.price,
                changePercent: live.changePercent,
                volume: live.volume
            };
        }
        return displayStock;
    });

    const sortedDisplayStocks = [...displayStocks].sort((a, b) => {
        const bySymbolThenId = () => {
            const symbolCompare = String(a?.symbol || "").localeCompare(String(b?.symbol || ""));
            if (symbolCompare !== 0) return symbolCompare;
            return Number(a?.stockId || 0) - Number(b?.stockId || 0);
        };

        if (isClientSortable) {
            const aVal = a?.[sortBy];
            const bVal = b?.[sortBy];

            const aSafe = aVal ?? 0;
            const bSafe = bVal ?? 0;

            const comparison = Number(aSafe) - Number(bSafe);
            if (comparison !== 0) {
                return sortDir === "asc" ? comparison : -comparison;
            }
            return bySymbolThenId();
        }

        if (!sortBy) {
            return bySymbolThenId();
        }

        return 0;
    });

    const handleMarketTypeChange = (nextMarketType) => {
        setFilters(EMPTY_FILTERS);
        setAppliedFilters({});
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("market", nextMarketType);
            newParams.set("explorePage", "0");
            newParams.delete("sortBy");
            newParams.delete("sortDir");
            FILTER_PARAM_KEYS.forEach((key) => newParams.delete(key));
            return newParams;
        });
    };

    const handleSortChange = (columnKey) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            const prevSortBy = newParams.get("sortBy") || "";
            const prevSortDir = newParams.get("sortDir") === "desc" ? "desc" : "asc";

            const nextSortDir = prevSortBy === columnKey
                ? (prevSortDir === "asc" ? "desc" : "asc")
                : "desc";

            newParams.set("sortBy", columnKey);
            newParams.set("sortDir", nextSortDir);
            newParams.set("explorePage", "0");
            return newParams;
        });
    };

    const renderSortHeader = (label, columnKey, align = "left") => {
        const isActive = sortBy === columnKey;
        const isAsc = sortDir === "asc";

        return (
            <button
                type="button"
                onClick={() => handleSortChange(columnKey)}
                className={cn(
                    "inline-flex items-center gap-1.5 hover:text-foreground transition-colors",
                    align === "right" && "ml-auto"
                )}
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

    // Handle search
    const handleSearch = () => {
        setAppliedSearch(searchQuery);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("explorePage", "0");
            if (searchQuery.trim()) {
                newParams.set("q", searchQuery.trim());
            } else {
                newParams.delete("q");
            }
            return newParams;
        });
    };

    // Handle Filter Apply
    const handleApplyFilters = () => {
        const activeFilters = { ...filters };

        // Clean up default ranges
        if (Number(activeFilters.minPrice) === FILTER_DEFAULTS.price.min &&
            Number(activeFilters.maxPrice) === FILTER_DEFAULTS.price.max) {
            delete activeFilters.minPrice;
            delete activeFilters.maxPrice;
        }

        if (Number(activeFilters.minVolume) === FILTER_DEFAULTS.volume.min &&
            Number(activeFilters.maxVolume) === FILTER_DEFAULTS.volume.max) {
            delete activeFilters.minVolume;
            delete activeFilters.maxVolume;
        }

        // Clean up empty strings
        if (!activeFilters.sector) delete activeFilters.sector;
        if (!activeFilters.exchange) delete activeFilters.exchange;

        setAppliedFilters(activeFilters);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("explorePage", "0");
            FILTER_PARAM_KEYS.forEach((key) => newParams.delete(key));
            Object.entries(activeFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    newParams.set(key, String(value));
                }
            });
            return newParams;
        });
    };

    // Handle Filter Clear
    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setAppliedFilters({});
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("explorePage", "0");
            FILTER_PARAM_KEYS.forEach((key) => newParams.delete(key));
            return newParams;
        });
    };

    // Handle search on Enter key
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    // Clear search (also clears filters as per previous logic, keeping consistent)
    const clearSearch = () => {
        setSearchQuery("");
        setAppliedSearch("");
        setFilters(EMPTY_FILTERS);
        setAppliedFilters({});
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("explorePage", "0");
            newParams.delete("q");
            FILTER_PARAM_KEYS.forEach((key) => newParams.delete(key));
            return newParams;
        });
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("explorePage", newPage.toString());
            return newParams;
        });
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Search className="h-7 w-7 text-primary" />
                            Explore Stocks
                        </h1>
                        <p className="text-muted-foreground">
                            Discover and explore available stocks on the platform
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {marketType === "domestic" && isMarketOpen && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${wsConnected
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                <Wifi className={`h-3 w-3 ${wsConnected ? '' : 'animate-pulse'}`} />
                                {wsConnected ? 'Live Updates • ~3s' : 'Connecting to live updates...'}
                            </div>
                        )}
                        <RefreshButton
                            onClick={() => refetch()}
                            isLoading={isFetching}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/40 border border-border w-fit">
                    <Button
                        size="sm"
                        variant={marketType === "domestic" ? "default" : "ghost"}
                        className={cn("h-8", marketType === "domestic" && "bg-primary text-primary-foreground")}
                        onClick={() => handleMarketTypeChange("domestic")}
                    >
                        Domestic
                    </Button>
                    <Button
                        size="sm"
                        variant={marketType === "international" ? "default" : "ghost"}
                        className={cn("h-8", marketType === "international" && "bg-primary text-primary-foreground")}
                        onClick={() => handleMarketTypeChange("international")}
                    >
                        International
                    </Button>
                </div>

                {/* Search */}
                <div className="glass-card p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-foreground/55" />
                            <Input
                                placeholder="Search by symbol or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="pl-10 glass-input"
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/55 hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button onClick={handleSearch} disabled={loading} className="gap-2">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            Search
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                {marketType === "domestic" && (
                    <StockFilters
                        filters={filters}
                        setFilters={setFilters}
                        onApply={handleApplyFilters}
                        onClear={handleClearFilters}
                    />
                )}

                {/* Stocks Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Stock", "name")}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Symbol", "symbol")}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Exchange", "exchange")}
                                    </th>
                                    {marketType === "domestic" && (
                                        <>
                                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                                {renderSortHeader("Price", "currentPrice", "right")}
                                            </th>
                                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                                {renderSortHeader("Change", "changePercent", "right")}
                                            </th>
                                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                                {renderSortHeader(isMarketOpen ? "Volume" : "Avg Vol", "volume", "right")}
                                            </th>
                                        </>
                                    )}
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Sector", "sector")}
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <StockTable
                                    stocks={sortedDisplayStocks}
                                    loading={loading}
                                    searchQuery={appliedSearch}
                                    showStatus={false}
                                    showMetrics={marketType === "domestic"}
                                    onRowClick={(stock) =>
                                        navigate(`/stock/${stock.stockId}`, {
                                            state: {
                                                from: {
                                                    pathname: location.pathname,
                                                    search: location.search,
                                                },
                                            },
                                        })
                                    }
                                />
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalElements > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            pageSize={PAGE_SIZE}
                            onPageChange={handlePageChange}
                            isLoading={loading}
                            itemLabel="stocks"
                        />
                    )}
                </div>
            </div>
        </>
    );
}
