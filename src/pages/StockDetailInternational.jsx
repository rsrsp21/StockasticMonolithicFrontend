import { useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Clock, Share2, TrendingDown, TrendingUp, Globe2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { InternationalStockChart } from "../components/stocks/InternationalStockChart";
import { SkeletonStockDetail } from "../components/ui/skeleton";
import {
    getStockById,
    getInternationalChartData,
    getInternationalLatestPrice,
} from "../services/stockPriceService";
import { usePageTitle } from "../hooks/usePageTitle";

// Exchange → ISO 4217 currency code for Frankfurter API
const EXCHANGE_CURRENCY_CODE = {
    NASDAQ: "USD",
    NYSE:   "USD",
    AMEX:   "USD",
    LSE:    "GBP",
    TSE:    "JPY",
    SSE:    "CNY",
    HKEX:  "HKD",
};

const getCurrencyCode = (exchange) =>
    EXCHANGE_CURRENCY_CODE[(exchange || "").toUpperCase()] || "USD";

const getCurrencySymbol = (exchange) => {
    const upper = String(exchange || "").toUpperCase();
    if (["NASDAQ", "NYSE", "AMEX"].includes(upper)) return "$";
    if (upper === "LSE") return "£";
    if (upper === "TSE") return "¥";
    return "";
};

const formatVolume = (vol) => {
    if (!vol) return "—";
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toLocaleString();
};

const formatNative = (value, currency) =>
    value != null
        ? `${currency}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : "—";

const formatInr = (value, rate) =>
    value != null && rate
        ? `₹${(Number(value) * rate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
        : "—";

export default function StockDetailInternational() {
    const { stockId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromLocation = location.state?.from;
    const navigateBack = () => {
        if (fromLocation?.pathname) {
            navigate(`${fromLocation.pathname}${fromLocation.search || ""}`);
            return;
        }
        navigate(-1);
    };

    // Single INR state — controls both price card and chart simultaneously
    const [inrRate, setInrRate] = useState(null);
    const [inrLoading, setInrLoading] = useState(false);
    const [showInr, setShowInr] = useState(false);

    const stockQuery = useQuery({
        queryKey: ["intlStock", stockId],
        queryFn: () => getStockById(stockId),
        enabled: !!stockId,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const latestQuery = useQuery({
        queryKey: ["intlLatest", stockId],
        queryFn: () => getInternationalLatestPrice(stockId),
        enabled: !!stockId,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const stock = stockQuery.data;
    const latest = latestQuery.data;

    usePageTitle(stock?.symbol ? `${stock.symbol} - ${stock.name}` : "International Stock Detail");

    // Fetch live INR rate from Frankfurter once exchange is known — fetched once, shared everywhere
    useEffect(() => {
        if (!stock?.exchange) return;
        const currencyCode = getCurrencyCode(stock.exchange);
        if (currencyCode === "INR") {
            setInrRate(1);
            return;
        }
        setInrLoading(true);
        fetch(`https://api.frankfurter.app/latest?from=${currencyCode}&to=INR`)
            .then((res) => res.json())
            .then((data) => {
                const rate = data?.rates?.INR;
                if (rate) setInrRate(rate);
            })
            .catch(() => setInrRate(null))
            .finally(() => setInrLoading(false));
    }, [stock?.exchange]);

    const fetchHistoricalRange = useCallback(
        (range) => getInternationalChartData(stockId, range),
        [stockId]
    );

    const currentPrice = latest?.price ?? 0;
    const changePercent = latest?.changePercent ?? 0;
    const changeValue = latest?.previousClose ? currentPrice - latest.previousClose : 0;
    const isPositive = changeValue >= 0;
    const currency = getCurrencySymbol(stock?.exchange);
    const openPrice = latest?.openPrice ?? latest?.previousClose ?? null;

    // Display helper — switches between native and INR based on single toggle
    const statPrice = (value) =>
        showInr && inrRate ? formatInr(value, inrRate) : formatNative(value, currency);

    const handleShare = async () => {
        if (!stock) return;
        const shareData = {
            title: `${stock.symbol} - ${stock.name}`,
            text: `Check out ${stock.name} (${stock.symbol}) on Stockastic.`,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                toast.success("Link copied to clipboard");
            }
        } catch (err) {
            if (err.name !== "AbortError") toast.error("Failed to share");
        }
    };

    if (stockQuery.isLoading || latestQuery.isLoading) {
        return <SkeletonStockDetail />;
    }

    if (!stock || stockQuery.error || latestQuery.error) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-xl text-muted-foreground">International stock data unavailable</p>
                    <Button onClick={navigateBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Explore
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={navigateBack} className="shrink-0 mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center overflow-hidden">
                            {stock.image ? (
                                <img
                                    src={`${import.meta.env.VITE_STOCK_IMAGE_URL}/${stock.image}`}
                                    alt={stock.symbol}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-primary">{stock.symbol?.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{stock.name}</h1>
                                <Badge variant="secondary" className="font-mono">{stock.symbol}</Badge>
                                <Badge variant="outline" className="gap-1">
                                    <Globe2 className="h-3 w-3" />
                                    Read-only
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                <span>{stock.exchange}</span>
                                {stock.sector && <><span>•</span><span>{stock.sector}</span></>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 ml-12 lg:ml-0">
                    <p className="text-sm text-muted-foreground">
                        Read only · Snapshot data · No live updates
                    </p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                        <Share2 className="h-4 w-4" /> Share
                    </Button>
                </div>
            </div>

            {/* Price Card */}
            <div className="glass-card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        {/* Header row: label + single INR toggle */}
                        <div className="flex items-center gap-3 mb-1">
                            <p className="text-sm text-muted-foreground">Latest Price</p>
                            {inrLoading && (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                            {/* Single INR toggle — controls price card AND chart tooltip */}
                            {inrRate && !inrLoading && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowInr((p) => !p)}
                                    aria-pressed={showInr}
                                    className={`h-6 px-2 text-xs font-medium rounded-full ${
                                        showInr
                                            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                            : "bg-secondary text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    ₹ INR
                                </Button>
                            )}
                        </div>

                        {/* Current price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold tracking-tight">
                                {showInr && inrRate
                                    ? formatInr(currentPrice, inrRate)
                                    : formatNative(currentPrice, currency)}
                            </span>
                            <div className={`flex items-center gap-1 text-lg font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                <span>
                                    {isPositive ? "+" : ""}
                                    {showInr && inrRate
                                        ? formatInr(changeValue, inrRate)
                                        : changeValue.toFixed(2)}
                                </span>
                                <span className="text-sm">({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)</span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Snapshot data · updated on page load
                            {showInr && inrRate && (
                                <span className="ml-1 text-primary">
                                    · 1 {getCurrencyCode(stock.exchange)} = ₹{inrRate.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Stats — all switch to INR when toggle is on */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 lg:gap-8 lg:border-l lg:pl-8 border-border/50">
                        <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">Open</p>
                            <p className="text-sm font-bold font-mono">{statPrice(openPrice)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">High</p>
                            <p className="text-sm font-bold font-mono text-green-500">{statPrice(latest?.dayHigh)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">Low</p>
                            <p className="text-sm font-bold font-mono text-red-500">{statPrice(latest?.dayLow)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">Volume</p>
                            <p className="text-sm font-bold font-mono">{formatVolume(latest?.volume)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">52W High</p>
                            <p className="text-sm font-bold font-mono text-green-500">{statPrice(latest?.fiftyTwoWeekHigh)}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">52W Low</p>
                            <p className="text-sm font-bold font-mono text-red-500">{statPrice(latest?.fiftyTwoWeekLow)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className={stock.description ? "lg:col-span-2" : "lg:col-span-3"}>
                    {/* Pass both inrRate and showInr down — chart uses the same toggle state */}
                    <InternationalStockChart
                        stockId={stockId}
                        exchange={stock.exchange}
                        historicalRangeFetcher={fetchHistoricalRange}
                        inrRate={inrRate}
                        showInr={showInr}
                    />
                </div>

                {stock.description && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 border-l-2 border-l-primary/30">
                            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                About {stock.name}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{stock.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
