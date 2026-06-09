/**
 * InternationalStockChart
 * Simplified chart for international (non-NSE/BSE) stocks.
 * - No IST slot grid, no WebSocket, no auto-refresh scheduler
 * - No RSI/MACD indicators (not supported for international stocks)
 * - Maps raw UTC timestamps directly to chart points
 * - 1D X-axis is bounded to full exchange session so partial-day data
 *   appears correctly in the left portion with empty space to the right
 * - Supports 1D intraday + 1W/1M/3M/1Y/3Y historical timeframes
 * - Displays time in the stock's local exchange timezone
 * - INR conversion controlled by parent via showInr + inrRate props
 */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Button } from "../ui/button";
import { Loader2, TrendingUp, TrendingDown, BarChart2, LineChart as LineChartIcon } from "lucide-react";
import {
    getInternationalIntradayHistory,
    getInternationalChartData,
} from "../../services/stockPriceService";
import { useTheme } from "next-themes";

// Chart.js imports for candlestick
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip as ChartTooltip,
} from "chart.js";
import { Chart as ReactChart } from "react-chartjs-2";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import "chartjs-adapter-date-fns";

ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    CandlestickController,
    CandlestickElement,
    ChartTooltip
);

const EXCHANGE_TIMEZONE = {
    NASDAQ: "America/New_York",
    NYSE:   "America/New_York",
    AMEX:   "America/New_York",
    LSE:    "Europe/London",
    TSE:    "Asia/Tokyo",
    SSE:    "Asia/Shanghai",
    HKEX:  "Asia/Hong_Kong",
};

const EXCHANGE_CURRENCY = {
    NASDAQ: "$",
    NYSE:   "$",
    AMEX:   "$",
    LSE:    "£",
    TSE:    "¥",
    SSE:    "¥",
    HKEX:  "HK$",
};

const EXCHANGE_SESSION_MINUTES = {
    NASDAQ: 390,
    NYSE:   390,
    AMEX:   390,
    LSE:    510,
    TSE:    360,
    SSE:    330,
    HKEX:  390,
};

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "3Y"];

const getTimezone = (exchange) =>
    EXCHANGE_TIMEZONE[(exchange || "").toUpperCase()] || "UTC";

const getCurrency = (exchange) =>
    EXCHANGE_CURRENCY[(exchange || "").toUpperCase()] || "";

const getSessionMinutes = (exchange) =>
    EXCHANGE_SESSION_MINUTES[(exchange || "").toUpperCase()] || 390;

const formatPrice = (value, currency) =>
    `${currency}${Number(value).toFixed(2)}`;

const formatInr = (value, rate) =>
    `₹${(Number(value) * rate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDateForTimeframe = (date, tf, timezone) => {
    switch (tf) {
        case "1D":
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone,
            });
        case "1W":
            return date.toLocaleDateString("en-US", {
                weekday: "short", day: "numeric", timeZone: timezone,
            });
        case "1M":
        case "3M":
            return date.toLocaleDateString("en-US", {
                day: "numeric", month: "short", timeZone: timezone,
            });
        case "1Y":
        case "3Y":
            return date.toLocaleDateString("en-US", {
                month: "short", year: "2-digit", timeZone: timezone,
            });
        default:
            return date.toLocaleDateString();
    }
};

const toUtcMs = (rawTime) => {
    if (!rawTime) return null;
    const utc =
        rawTime.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(rawTime)
            ? rawTime
            : rawTime + "Z";
    return new Date(utc).getTime();
};

// -----------------------------------------------------------------
// CustomTooltip is defined OUTSIDE the component so it never gets
// a stale closure over showInr / inrRate — values are passed as props
// -----------------------------------------------------------------
const CustomTooltip = ({ active, payload, showInr, inrRate, currency }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl z-50">
            <p className="text-xs text-muted-foreground mb-1">{data.time}</p>
            <p className="text-lg font-bold">{formatPrice(data.price, currency)}</p>
            {showInr && inrRate && (
                <p className="text-sm font-medium text-primary">{formatInr(data.price, inrRate)}</p>
            )}
            {data.high != null && (
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p>O: {formatPrice(data.open, currency)} | H: {formatPrice(data.high, currency)}</p>
                    <p>L: {formatPrice(data.low, currency)} | V: {data.volume ? `${(data.volume / 1000).toFixed(1)}K` : "—"}</p>
                    {showInr && inrRate && (
                        <p>H: {formatInr(data.high, inrRate)} | L: {formatInr(data.low, inrRate)}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export function InternationalStockChart({
    stockId,
    exchange,
    historicalRangeFetcher = null,
    availableTimeframes = TIMEFRAMES,
    // Both controlled by parent — single toggle in StockDetailInternational
    inrRate = null,
    showInr = false,
}) {
    const { resolvedTheme } = useTheme();
    const [timeframe, setTimeframe] = useState("1D");
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartType, setChartType] = useState("area");
    const [sessionBounds, setSessionBounds] = useState(null);
    const chartCache = useRef({});

    const timezone = getTimezone(exchange);
    const currency = getCurrency(exchange);
    const sessionMinutes = getSessionMinutes(exchange);

    const enabledTimeframes = useMemo(
        () => TIMEFRAMES.filter((tf) => availableTimeframes.includes(tf)),
        [availableTimeframes]
    );

    useEffect(() => {
        chartCache.current = {};
        setSessionBounds(null);
    }, [stockId, exchange]);

    useEffect(() => {
        if (timeframe !== "1D") setSessionBounds(null);
    }, [timeframe]);

    const chartThemeColors = useMemo(() => {
        if (typeof window === "undefined") {
            return { border: "rgba(148,163,184,0.35)", muted: "rgba(148,163,184,0.9)" };
        }
        const styles = getComputedStyle(document.documentElement);
        const border = styles.getPropertyValue("--border").trim();
        const muted = styles.getPropertyValue("--muted-foreground").trim();
        const toHsl = (token, fallback) => {
            const parts = token.trim().split(/\s+/);
            return parts.length >= 3 ? `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})` : fallback;
        };
        return {
            border: toHsl(border, "rgba(148,163,184,0.35)"),
            muted: toHsl(muted, "rgba(148,163,184,0.9)"),
        };
    }, [resolvedTheme]);

    const fetchChartData = useCallback(async () => {
        if (!stockId) return;

        if (timeframe !== "1D" && chartCache.current[timeframe]) {
            setChartData(chartCache.current[timeframe]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (timeframe === "1D") {
                const response = await getInternationalIntradayHistory(stockId, "1d");
                const prices = response?.priceHistory || [];

                if (prices.length === 0) {
                    setChartData([]);
                    setSessionBounds(null);
                    return;
                }

                const apiPreviousClose = prices[0]?.previousClose ?? null;

                const data = prices.map((item) => {
                    const ts = toUtcMs(item.priceTime);
                    return {
                        time: formatDateForTimeframe(new Date(ts), "1D", timezone),
                        timestamp: ts,
                        x: ts,
                        price: item.intervalClose ?? item.price ?? null,
                        previousClose: apiPreviousClose,
                        open: item.intervalOpen ?? null,
                        high: item.intervalHigh ?? null,
                        low: item.intervalLow ?? null,
                        volume: item.intervalVolume ?? item.volume ?? null,
                    };
                });

                setChartData(data);

                const firstTs = data[0].timestamp;
                setSessionBounds({
                    min: firstTs,
                    max: firstTs + sessionMinutes * 60 * 1000,
                });
            } else {
                let response;
                if (historicalRangeFetcher) {
                    response = await historicalRangeFetcher(timeframe);
                } else {
                    response = await getInternationalChartData(stockId, timeframe);
                }

                const dataPoints = response?.dataPoints || [];
                const data = dataPoints.map((point) => {
                    const date = new Date(point.time);
                    return {
                        time: formatDateForTimeframe(date, timeframe, timezone),
                        timestamp: date.getTime(),
                        x: date.getTime(),
                        price: point.close,
                        open: point.open,
                        high: point.high,
                        low: point.low,
                        volume: point.volume,
                    };
                });

                chartCache.current[timeframe] = data;
                setChartData(data);
            }
        } catch (err) {
            console.error("InternationalStockChart fetch error:", err);
            setError("Failed to load chart data");
            setChartData([]);
        } finally {
            setLoading(false);
        }
    }, [stockId, timeframe, timezone, sessionMinutes, historicalRangeFetcher]);

    useEffect(() => {
        fetchChartData();
    }, [fetchChartData]);

    const filledData = chartData.filter((d) => d.price !== null);
    const lastPrice = filledData.length > 0 ? filledData[filledData.length - 1].price : 0;
    const previousClose =
        filledData.length > 0 && filledData[0].previousClose
            ? filledData[0].previousClose
            : filledData.length > 0 ? filledData[0].price : 0;
    const isPositive = lastPrice >= previousClose;

    const yDomain = useMemo(() => {
        if (chartData.length === 0) return ["auto", "auto"];
        const highs = chartData.map((d) => d.high ?? d.price).filter(Boolean);
        const lows = chartData.map((d) => d.low ?? d.price).filter(Boolean);
        if (highs.length === 0) return ["auto", "auto"];
        const min = Math.min(...lows);
        const max = Math.max(...highs);
        const pad = (max - min) * 0.1;
        return [parseFloat((min - pad).toFixed(4)), parseFloat((max + pad).toFixed(4))];
    }, [chartData]);

    const xDomain = useMemo(() => {
        if (timeframe === "1D" && sessionBounds) return [sessionBounds.min, sessionBounds.max];
        return ["auto", "auto"];
    }, [timeframe, sessionBounds]);

    const chartJsConfig = useMemo(() => {
        if (chartType !== "candle" || chartData.length === 0) return null;
        const candleData = chartData
            .filter((d) => d.x != null && d.open != null && d.high != null && d.low != null && d.price != null)
            .map((d) => ({ x: d.x, o: d.open, h: d.high, l: d.low, c: d.price }));

        return {
            datasets: [{
                label: exchange,
                data: candleData,
                color: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
                borderColor: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
                borderColors: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
                wickColor: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
                backgroundColor: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
                backgroundColors: { up: "#22c55e", down: "#ef4444", unchanged: "#9ca3af" },
                barThickness: 6,
                maxBarThickness: 7,
                categoryPercentage: 0.72,
                barPercentage: 0.88,
            }],
        };
    }, [chartData, chartType, exchange]);

    const chartJsOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: "time",
                min: timeframe === "1D" && sessionBounds ? sessionBounds.min : undefined,
                max: timeframe === "1D" && sessionBounds ? sessionBounds.max : undefined,
                time: {
                    unit: timeframe === "1D" ? "hour" : "day",
                    displayFormats: { hour: "HH:mm", day: "dd MMM", month: "MMM yy" },
                    tooltipFormat: "dd MMM yyyy HH:mm",
                },
                grid: { display: false, borderColor: chartThemeColors.border },
                ticks: { color: chartThemeColors.muted, source: "auto" },
            },
            y: {
                position: "right",
                grid: { display: false, color: chartThemeColors.border, borderColor: chartThemeColors.border },
                ticks: {
                    color: chartThemeColors.muted,
                    callback: (value) => `${currency}${value}`,
                },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                    label: (context) => {
                        const p = context.raw;
                        const lines = [
                            `Open: ${currency}${p.o?.toFixed(2)}`,
                            `High: ${currency}${p.h?.toFixed(2)}`,
                            `Low: ${currency}${p.l?.toFixed(2)}`,
                            `Close: ${currency}${p.c?.toFixed(2)}`,
                        ];
                        if (showInr && inrRate) {
                            lines.push(`Close (INR): ${formatInr(p.c, inrRate)}`);
                        }
                        return lines;
                    },
                },
            },
        },
    }), [timeframe, sessionBounds, chartThemeColors, currency, showInr, inrRate]);

    return (
        <div className="glass-card p-6 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        {isPositive ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-muted-foreground">Price Chart</span>
                        {timeframe === "1D" && timezone !== "UTC" && (
                            <span className="text-xs text-muted-foreground">
                                ({timezone.split("/")[1]?.replace("_", " ")} time)
                            </span>
                        )}
                        {/* Non-clickable indicator showing INR mode is active */}
                        {showInr && inrRate && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                ₹ INR
                            </span>
                        )}
                    </div>

                    {/* Chart Type Toggle (Mobile) */}
                    <div className="flex sm:hidden gap-1 bg-secondary/50 p-1 rounded-lg">
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setChartType("area")}
                            className={`h-7 w-7 p-0 ${chartType === "area" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                        >
                            <LineChartIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
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
                                key={tf}
                                variant={timeframe === tf ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setTimeframe(tf)}
                                className={`h-7 px-3 text-xs font-medium ${
                                    timeframe === tf
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tf}
                            </Button>
                        ))}
                    </div>

                    {/* Chart Type Toggle (Desktop) */}
                    <div className="hidden sm:flex gap-1 bg-secondary/50 p-1 rounded-lg shrink-0">
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setChartType("area")}
                            className={`h-7 w-7 p-0 ${chartType === "area" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                            title="Area Chart"
                        >
                            <LineChartIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => setChartType("candle")}
                            className={`h-7 w-7 p-0 ${chartType === "candle" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                            title="Candlestick Chart"
                        >
                            <BarChart2 className="h-4 w-4 rotate-90" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full relative">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        {error}
                    </div>
                ) : filledData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <span className="text-lg font-medium mb-2">No intraday data available</span>
                        <span className="text-sm">Data will appear during market hours</span>
                    </div>
                ) : chartType === "area" ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="intlPositive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="intlNegative" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.55} />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                scale="time"
                                domain={xDomain}
                                hide={true}
                            />
                            <YAxis
                                domain={yDomain}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `${currency}${val}`}
                                width={65}
                                orientation="right"
                            />
                            {/* Pass showInr, inrRate, currency as props — no stale closure */}
                            <Tooltip
                                content={
                                    <CustomTooltip
                                        showInr={showInr}
                                        inrRate={inrRate}
                                        currency={currency}
                                    />
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={isPositive ? "#22c55e" : "#ef4444"}
                                strokeWidth={2}
                                fill={isPositive ? "url(#intlPositive)" : "url(#intlNegative)"}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 2, fill: isPositive ? "#22c55e" : "#ef4444" }}
                                connectNulls={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full p-2">
                        <ReactChart type="candlestick" data={chartJsConfig} options={chartJsOptions} />
                    </div>
                )}
            </div>
        </div>
    );
}