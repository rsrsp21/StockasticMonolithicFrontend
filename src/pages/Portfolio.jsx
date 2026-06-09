import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IndexTicker } from "../components/shared/IndexTicker";
import { SkeletonDashboard, Skeleton } from "../components/ui/skeleton";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { usePageTitle } from "../hooks/usePageTitle";
import { TrendingUp, Wallet, Briefcase, Activity, AlertTriangle, Wifi, ArrowUpRight, ArrowDownRight, LayoutDashboard, BarChart3 } from "lucide-react";
import { cn } from "../utils/utils";

import { StatCard } from "../components/dashboard/StatCard";
import { HoldingRow } from "../components/dashboard/HoldingRow";
import { AllocationCard } from "../components/dashboard/AllocationCard";
import { PortfolioChart } from "../components/dashboard/PortfolioChart";
import { Button } from "../components/ui/button";

export default function Portfolio() {
    usePageTitle("Portfolio");
    const { user, loading: authLoading } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Use the new hook for real-time portfolio data
    const {
        holdings,
        wallet,
        portfolioSummary,
        isLoading,
        error,
        wsConnected,
        isMarketOpen,
        chartData,
        isLoadingChart
    } = usePortfolioData();

    if (authLoading) {
        return (
            <>
                <Skeleton className="h-10 w-full mb-6" />
                <div className="mt-6">
                    <SkeletonDashboard />
                </div>
            </>
        );
    }

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(val);

    return (
        <>
            <IndexTicker />

            {/* Content with loading state */}
            <div className="mt-6 space-y-6">
                {isLoading ? (
                    <SkeletonDashboard />
                ) : error ? (
                    <div className="text-center py-12">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="animate-fade-in-up flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-muted-foreground">{getGreeting()}</span>
                                    <span className="text-xl">👋</span>
                                </div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    Welcome back, <span className="gradient-text">{user?.name || "Trader"}</span>
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Here&apos;s your portfolio overview for today
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => navigate('/explore')} variant="outline" size="sm" className="gap-2">
                                        <TrendingUp className="h-4 w-4" /> Explore Stocks
                                    </Button>
                                    <Button onClick={() => navigate('/market')} variant="outline" size="sm" className="gap-2">
                                        <BarChart3 className="h-4 w-4" /> Market Overview
                                    </Button>
                                </div>
                                {/* WS Indicator */}
                                {isMarketOpen && (
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${wsConnected
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        }`}>
                                        <Wifi className={`h-3 w-3 ${wsConnected ? '' : 'animate-pulse'}`} />
                                        {wsConnected ? 'Live Updates • ~3s' : 'Connecting to live updates...'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Invested"
                                value={formatCurrency(portfolioSummary.totalInvested)}
                                icon={Briefcase}
                                delay={0.1}
                            />
                            <StatCard
                                title="Current Value"
                                value={formatCurrency(portfolioSummary.currentValue)}
                                change={portfolioSummary.totalInvested > 0 ? `${portfolioSummary.dayPnlPercent >= 0 ? '+' : ''}${portfolioSummary.dayPnlPercent.toFixed(2)}%` : null}
                                changeType={portfolioSummary.isDayPositive ? "positive" : "negative"}
                                subtext="Today"
                                icon={Activity}
                                delay={0.2}
                            />
                            <StatCard
                                title="Total P&L"
                                value={`${portfolioSummary.isPositive ? '+' : ''}${formatCurrency(portfolioSummary.totalPnl)}`}
                                change={portfolioSummary.totalInvested > 0 ? `${portfolioSummary.pnlPercent >= 0 ? '+' : ''}${portfolioSummary.pnlPercent.toFixed(2)}%` : null}
                                changeType={portfolioSummary.isPositive ? "positive" : "negative"}
                                icon={TrendingUp}
                                delay={0.3}
                            />
                            <StatCard
                                title="Wallet Balance"
                                value={formatCurrency((wallet?.availableBalance || 0) + (wallet?.lockedBalance || 0))}
                                icon={Wallet}
                                delay={0.4}
                            />
                        </div>

                        {/* Charts and Holdings Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Portfolio Value Chart */}
                            <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-foreground">Portfolio Value</h3>
                                        <p className="text-sm text-muted-foreground">Investment growth</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-foreground">
                                            {formatCurrency(portfolioSummary.currentValue)}
                                        </div>
                                        {portfolioSummary.totalInvested > 0 && (
                                            <div className={cn(
                                                "flex items-center justify-end gap-1 text-sm",
                                                portfolioSummary.isPositive ? "stock-up" : "stock-down"
                                            )}>
                                                {portfolioSummary.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                {portfolioSummary.pnlPercent >= 0 ? '+' : ''}{portfolioSummary.pnlPercent.toFixed(2)}%
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-[250px] mt-4">
                                    <PortfolioChart
                                        invested={portfolioSummary.totalInvested}
                                        currentValue={portfolioSummary.currentValue}
                                        positive={portfolioSummary.isPositive}
                                    />
                                </div>
                            </div>

                            {/* Portfolio Allocation */}
                            <AllocationCard holdings={holdings} delay={0.6} />
                        </div>

                        {/* Holdings Section */}
                        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-foreground">Your Holdings</h3>
                                    <p className="text-sm text-muted-foreground">{holdings.length} active positions</p>
                                </div>
                                <button
                                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                    onClick={() => navigate('/holdings')}
                                >
                                    View All →
                                </button>
                            </div>
                            {holdings.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No holdings yet. Start investing to see your portfolio here!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {holdings.slice(0, 5).map((holding, i) => (
                                        <HoldingRow key={holding.holdingId || holding.symbol} holding={holding} delay={0.8 + i * 0.1} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
