import { useEffect, useState } from "react";
import { Skeleton } from "../../components/ui/skeleton";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
    HeartPulse,
    Database,
    HardDrive,
    Wifi,
    Shield,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Layers,
    Clock,
    Server,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function StatusBadge({ status }) {
    const isUp = status === "UP";
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isUp
                ? "bg-green-400/10 text-green-400 ring-1 ring-green-400/20"
                : "bg-red-400/10 text-red-400 ring-1 ring-red-400/20"
                }`}
        >
            {isUp ? (
                <CheckCircle className="h-3 w-3" />
            ) : (
                <XCircle className="h-3 w-3" />
            )}
            {status}
        </span>
    );
}

function HealthCard({ name, icon: Icon, status, details, iconColor }) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconColor}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-foreground capitalize">{name}</h3>
                </div>
                <StatusBadge status={status} />
            </div>
            {details && (
                <div className="mt-3 space-y-1.5">
                    {Object.entries(details).map(([key, value]) => {
                        if (typeof value === "object" && value !== null) return null;
                        return (
                            <div key={key} className="flex justify-between gap-3 text-sm min-w-0">
                                <span className="text-muted-foreground capitalize shrink-0">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                <span className="text-foreground font-mono text-xs truncate" title={String(value)}>
                                    {key === "total" || key === "free" || key === "threshold"
                                        ? formatBytes(value)
                                        : String(value)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CacheCard({ name, stats }) {
    const hits = stats?.hits ?? "-";
    const misses = stats?.misses ?? "-";
    const size = stats?.size ?? "-";
    const evictions = stats?.evictions ?? "-";
    const hitRate = (typeof hits === "number" && typeof misses === "number" && (hits + misses) > 0)
        ? Math.round((hits / (hits + misses)) * 100) + "%"
        : "—";
    return (
        <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-violet-400/10 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-violet-400" />
                </div>
                <p className="font-semibold text-foreground text-sm flex-1">{name}</p>
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Hits</span>
                    <span className="text-green-400 font-mono">{hits}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Misses</span>
                    <span className="text-red-400 font-mono">{misses}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Hit Rate</span>
                    <span className="text-foreground font-mono">{hitRate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="text-foreground font-mono">{size}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Evictions</span>
                    <span className="text-amber-400 font-mono">{evictions}</span>
                </div>
            </div>
        </div>
    );
}

// Convert cron expression to human-readable description
function describeCron(expr) {
    if (!expr) return null;
    const cronMap = {
        "0 */5 * * * *": "Every 5 minutes",
        "0 0 2 * * *": "Daily at 2:00 AM",
        "0 */1 * * * *": "Every minute",
        "0 0 * * * *": "Every hour",
        "0 0 0 * * *": "Daily at midnight",
    };
    return cronMap[expr] || expr;
}

// Parse fully qualified class.method into readable name
function parseTaskName(target) {
    if (!target) return { className: "Unknown", methodName: "Task" };
    const parts = target.split(".");
    const methodName = parts.pop();
    const className = parts.pop() || "Unknown";
    // Convert camelCase to Title Case with spaces
    const readable = (str) => str
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
    return { className: readable(className), methodName: readable(methodName) };
}

function ScheduledTaskCard({ task }) {
    const { className, methodName } = parseTaskName(task.runnable?.target);
    const cronDesc = describeCron(task.expression);
    return (
        <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm">
                        {methodName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {className}
                    </p>
                </div>
                {cronDesc && (
                    <span className="text-xs font-mono bg-amber-400/10 text-amber-400 px-2 py-1 rounded-md whitespace-nowrap">
                        {cronDesc}
                    </span>
                )}
            </div>
        </div>
    );
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const healthIcons = {
    db: { icon: Database, color: "bg-blue-400/10 text-blue-400" },
    diskSpace: { icon: HardDrive, color: "bg-emerald-400/10 text-emerald-400" },
    ping: { icon: Wifi, color: "bg-cyan-400/10 text-cyan-400" },
    ssl: { icon: Shield, color: "bg-orange-400/10 text-orange-400" },
    livenessState: {
        icon: HeartPulse,
        color: "bg-pink-400/10 text-pink-400",
    },
    readinessState: {
        icon: Server,
        color: "bg-indigo-400/10 text-indigo-400",
    },
};

export default function SystemHealth() {
    usePageTitle("System Health");
    const [health, setHealth] = useState(null);
    const [caches, setCaches] = useState(null);
    const [scheduledTasks, setScheduledTasks] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cacheMetrics, setCacheMetrics] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAll = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [healthRes, cachesRes, tasksRes] = await Promise.allSettled([
                axios.get(`${API_BASE}/actuator/health`),
                axios.get(`${API_BASE}/actuator/caches`),
                axios.get(`${API_BASE}/actuator/scheduledtasks`),
            ]);

            if (healthRes.status === "fulfilled") setHealth(healthRes.value.data);
            if (cachesRes.status === "fulfilled") setCaches(cachesRes.value.data);
            if (tasksRes.status === "fulfilled")
                setScheduledTasks(tasksRes.value.data);

            // Fetch per-cache metrics (CacheManager caches + programmatic caches)
            const programmaticCacheNames = ["priceAlertCache", "autoSellRuleCache", "indicatorWindowCache"];
            const cacheManagerNames = cachesRes.status === "fulfilled"
                ? Object.keys(cachesRes.value.data?.cacheManagers?.cacheManager?.caches || {})
                : [];
            const allCacheNames = [...cacheManagerNames, ...programmaticCacheNames];
            const metricsMap = {};
            await Promise.all(allCacheNames.map(async (name) => {
                try {
                    const [hitsRes, missRes, sizeRes, evictRes] = await Promise.allSettled([
                        axios.get(`${API_BASE}/actuator/metrics/cache.gets?tag=cache:${name},result:hit`),
                        axios.get(`${API_BASE}/actuator/metrics/cache.gets?tag=cache:${name},result:miss`),
                        axios.get(`${API_BASE}/actuator/metrics/cache.size?tag=cache:${name}`),
                        axios.get(`${API_BASE}/actuator/metrics/cache.evictions?tag=cache:${name}`),
                    ]);
                    metricsMap[name] = {
                        hits: hitsRes.status === "fulfilled" ? hitsRes.value.data.measurements?.[0]?.value : null,
                        misses: missRes.status === "fulfilled" ? missRes.value.data.measurements?.[0]?.value : null,
                        size: sizeRes.status === "fulfilled" ? sizeRes.value.data.measurements?.[0]?.value : null,
                        evictions: evictRes.status === "fulfilled" ? evictRes.value.data.measurements?.[0]?.value : null,
                    };
                } catch (e) {
                    metricsMap[name] = {};
                }
            }));
            setCacheMetrics(metricsMap);

            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to fetch actuator data", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => fetchAll(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const allCaches = caches?.cacheManagers?.cacheManager?.caches
        ? Object.entries(caches.cacheManagers.cacheManager.caches)
        : [];

    const cronTasks = scheduledTasks?.cron || [];
    const fixedRateTasks = scheduledTasks?.fixedRate || [];
    const allTasks = [...cronTasks, ...fixedRateTasks];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">System Health</h1>
                    <p className="text-muted-foreground">
                        Real-time application monitoring via Spring Boot Actuator
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                            Updated{" "}
                            {lastUpdated.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </span>
                    )}
                    <button
                        onClick={() => fetchAll(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overall Status */}
            {loading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
            ) : health ? (
                <div
                    className={`rounded-xl border p-4 flex items-center gap-4 ${health.status === "UP"
                        ? "border-green-400/20 bg-green-400/5"
                        : "border-red-400/20 bg-red-400/5"
                        }`}
                >
                    <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center ${health.status === "UP"
                            ? "bg-green-400/10"
                            : "bg-red-400/10"
                            }`}
                    >
                        {health.status === "UP" ? (
                            <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : (
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-lg font-bold text-foreground">
                            System Status:{" "}
                            <span
                                className={
                                    health.status === "UP" ? "text-green-400" : "text-red-400"
                                }
                            >
                                {health.status === "UP" ? "All Systems Operational" : "Degraded"}
                            </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {health.components
                                ? `${Object.keys(health.components).length} components monitored`
                                : "No component data available"}
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Health Components */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Health Components
                </h2>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                ) : health?.components ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(health.components).map(([name, component]) => {
                            const config = healthIcons[name] || {
                                icon: Server,
                                color: "bg-gray-400/10 text-gray-400",
                            };
                            return (
                                <HealthCard
                                    key={name}
                                    name={name}
                                    icon={config.icon}
                                    iconColor={config.color}
                                    status={component.status}
                                    details={component.details}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">
                        No health data available
                    </p>
                )}
            </div>

            {/* Caches */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                    Active Caches
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                    Caffeine-backed caches managed by Spring CacheManager
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mb-4 px-1">
                    <span><span className="text-green-400 font-semibold">Hits</span> — served from cache</span>
                    <span><span className="text-red-400 font-semibold">Misses</span> — fetched from DB</span>
                    <span><span className="text-foreground font-semibold">Hit Rate</span> — % served from cache</span>
                    <span><span className="text-foreground font-semibold">Size</span> — current entries</span>
                    <span><span className="text-amber-400 font-semibold">Evictions</span> — removed by TTL/max-size</span>
                </div>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...Array(9)].map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                    </div>
                ) : allCaches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {allCaches.map(([name]) => (
                            <CacheCard key={name} name={name} stats={cacheMetrics[name]} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">
                        No caches registered
                    </p>
                )}
            </div>

            {/* Programmatic Caches */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                    Service Caches
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Standalone Caffeine caches injected directly into services
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { name: "priceAlertCache", service: "PriceAlertService" },
                        { name: "autoSellRuleCache", service: "AutoSellService" },
                        { name: "indicatorWindowCache", service: "IndicatorService" },
                    ].map((cache) => (
                        <div key={cache.name} className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-9 w-9 rounded-lg bg-teal-400/10 flex items-center justify-center">
                                    <Layers className="h-4 w-4 text-teal-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground text-sm">{cache.name}</p>
                                    <p className="text-xs text-muted-foreground">{cache.service}</p>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                            </div>
                            {(() => {
                                const s = cacheMetrics[cache.name];
                                const hits = s?.hits ?? "-";
                                const misses = s?.misses ?? "-";
                                const size = s?.size ?? "-";
                                const evictions = s?.evictions ?? "-";
                                const hitRate = (typeof hits === "number" && typeof misses === "number" && (hits + misses) > 0)
                                    ? Math.round((hits / (hits + misses)) * 100) + "%" : "—";
                                return (
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Hits</span>
                                            <span className="text-green-400 font-mono">{hits}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Misses</span>
                                            <span className="text-red-400 font-mono">{misses}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Hit Rate</span>
                                            <span className="text-foreground font-mono">{hitRate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Size</span>
                                            <span className="text-foreground font-mono">{size}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Evictions</span>
                                            <span className="text-amber-400 font-mono">{evictions}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scheduled Tasks */}
            {allTasks.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                        Scheduled Tasks
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Background jobs registered via @Scheduled
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allTasks.map((task, i) => (
                            <ScheduledTaskCard key={i} task={task} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
