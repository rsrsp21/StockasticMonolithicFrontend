/**
 * Holdings Page - Shows user's holdings and order history
 */
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HoldingsCard } from "../components/orders/HoldingsCard";
import { OrderHistoryRow } from "../components/orders/OrderHistoryRow";
import { BuySellModal } from "../components/orders/BuySellModal";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { SkeletonCard } from "../components/ui/skeleton";
import { Pagination } from "../components/common/Pagination";
import { ordersApi } from "../api/ordersApi";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { toast } from "sonner";
import { usePageTitle } from "../hooks/usePageTitle";
import { useKYCStatus } from "../hooks/useKYCStatus";
import { cn } from "../utils/utils";
import {
    Briefcase, TrendingUp, TrendingDown, History, RefreshCw, AlertTriangle, Wifi, WifiOff
} from "lucide-react";
import { RefreshButton } from "../components/common/RefreshButton";

export default function Holdings() {
    usePageTitle("Holdings");
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        holdings,
        portfolioSummary,
        isLoading: isLoadingHoldings,
        refetch: refetchHoldings,
        isMarketOpen,
        wsConnected,
        wallet
    } = usePortfolioData();

    const { kycStatus } = useKYCStatus();
    const isKYCApproved = kycStatus === "APPROVED";

    // Orders Query & Pagination
    const PAGE_SIZE = 10;
    const orderPage = parseInt(searchParams.get("orderPage") || "0", 10);

    const { data: allOrders = [], isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
        queryKey: ['orders'],
        queryFn: ordersApi.getOrderHistory,
    });

    const paginatedOrders = allOrders.slice(
        orderPage * PAGE_SIZE,
        (orderPage + 1) * PAGE_SIZE
    );

    const totalOrders = allOrders.length;
    const totalOrderPages = Math.ceil(totalOrders / PAGE_SIZE);

    const handleOrderPageChange = (newPage) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("orderPage", newPage.toString());
            return newParams;
        });
    };

    const [cancellingOrderId, setCancellingOrderId] = useState(null);

    // Trading modal state
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeOrderType, setTradeOrderType] = useState('BUY');
    const [selectedHolding, setSelectedHolding] = useState(null);

    const handleRefresh = async () => {
        await Promise.all([
            refetchHoldings(),
            refetchOrders()
        ]);
    };

    // Handle order cancellation
    const handleCancelOrder = async (orderId) => {
        setCancellingOrderId(orderId);
        try {
            await ordersApi.cancelOrder(orderId);
            toast.success(MESSAGES.SUCCESS.ORDER.CANCELLED);
            refetchOrders();
            refetchHoldings(); // Refresh holdings as blocked funds/shares are released
        } catch (error) {
            console.error("Failed to cancel order:", error);
            toast.error(error.response?.data?.message || "Failed to cancel order");
        } finally {
            setCancellingOrderId(null);
        }
    };

    // Handle buy/sell from holdings
    const handleBuy = (holding) => {
        if (!isKYCApproved) {
            toast.error("KYC approval is required to trade. Please complete your KYC verification.");
            return;
        }
        setSelectedHolding({
            stockId: holding.stockId,
            symbol: holding.symbol,
            name: holding.stockName
        });
        setTradeOrderType('BUY');
        setShowTradeModal(true);
    };

    const handleSell = (holding) => {
        if (!isKYCApproved) {
            toast.error("KYC approval is required to trade. Please complete your KYC verification.");
            return;
        }
        setSelectedHolding({
            stockId: holding.stockId,
            symbol: holding.symbol,
            name: holding.stockName
        });
        setTradeOrderType('SELL');
        setShowTradeModal(true);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    // Pending orders count
    const pendingOrdersCount = allOrders.filter(o => o.status === 'PENDING').length;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Briefcase className="h-7 w-7 text-primary" />
                            Holdings
                        </h1>
                        <p className="text-muted-foreground">View your holdings and order history here.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => navigate('/explore')} variant="outline" size="sm" className="gap-2">
                            <TrendingUp className="h-4 w-4" /> Explore Stocks
                        </Button>
                        {isMarketOpen && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${wsConnected
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                <Wifi className={`h-3 w-3 ${wsConnected ? '' : 'animate-pulse'}`} />
                                {wsConnected ? 'Live Updates • ~3s' : 'Connecting to live updates...'}
                            </div>
                        )}
                        <RefreshButton
                            onClick={handleRefresh}
                            isLoading={isLoadingHoldings || isLoadingOrders}
                            size="sm"
                        />
                    </div>
                </div>

                {/* Portfolio Summary Card */}
                <div className="glass-card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Invested</p>
                            <p className="text-2xl font-bold">{formatCurrency(portfolioSummary.totalInvested)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold">{formatCurrency(portfolioSummary.currentValue)}</p>
                                {portfolioSummary.dayPnl !== 0 && (
                                    <span className={`text-xs ${portfolioSummary.isDayPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {portfolioSummary.isDayPositive ? '+' : ''}
                                        {formatCurrency(portfolioSummary.dayPnl)} Today
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total P&L</p>
                            <div className={`flex items-center gap-2 ${portfolioSummary.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {portfolioSummary.isPositive ? (
                                    <TrendingUp className="h-5 w-5" />
                                ) : (
                                    <TrendingDown className="h-5 w-5" />
                                )}
                                <span className="text-2xl font-bold">
                                    {portfolioSummary.isPositive ? '+' : ''}{formatCurrency(portfolioSummary.totalPnl)}
                                </span>
                                <span className="text-sm">
                                    ({portfolioSummary.isPositive ? '+' : ''}{portfolioSummary.pnlPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="holdings" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="holdings" className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            Holdings ({holdings.length})
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="gap-2">
                            <History className="h-4 w-4" />
                            Orders
                            {pendingOrdersCount > 0 && (
                                <Badge className="bg-yellow-500/20 text-yellow-500 text-xs ml-1">
                                    {pendingOrdersCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Holdings Tab */}
                    <TabsContent value="holdings" className="mt-6">
                        {isLoadingHoldings ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : holdings.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Holdings Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start investing by buying stocks from the Explore page.
                                </p>
                                <Button onClick={() => navigate('/explore')}>
                                    Browse Stocks
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {holdings.map(holding => (
                                    <HoldingsCard
                                        key={holding.holdingId}
                                        holding={holding}
                                        onBuy={handleBuy}
                                        onSell={handleSell}
                                        onClick={() => navigate(`/stock/${holding.stockId}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Orders Tab */}
                    <TabsContent value="orders" className="mt-6">
                        {isLoadingOrders ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <SkeletonCard key={i} className="h-20" />)}
                            </div>
                        ) : paginatedOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                                <p className="text-muted-foreground">
                                    Your order history will appear here.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {paginatedOrders.map(order => (
                                        <OrderHistoryRow
                                            key={order.orderId}
                                            order={order}
                                            onCancel={handleCancelOrder}
                                            isLoading={cancellingOrderId === order.orderId}
                                        />
                                    ))}
                                </div>
                                {/* Pagination Controls */}
                                {totalOrders > 0 && (
                                    <div className="mt-4">
                                        <Pagination
                                            currentPage={orderPage}
                                            totalPages={totalOrderPages}
                                            totalElements={totalOrders}
                                            pageSize={PAGE_SIZE}
                                            onPageChange={handleOrderPageChange}
                                            isLoading={isLoadingOrders}
                                            itemLabel="orders"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Trade Modal */}
            {selectedHolding && (
                <BuySellModal
                    isOpen={showTradeModal}
                    onOpenChange={setShowTradeModal}
                    stock={selectedHolding}
                    currentPrice={holdings.find(h => h.stockId === selectedHolding.stockId)?.currentPrice || 0}
                    isMarketOpen={isMarketOpen}
                    orderType={tradeOrderType}
                    onSuccess={() => {
                        handleRefresh();
                    }}
                    availableBalance={(wallet?.availableBalance || 0) + (wallet?.lockedBalance || 0)}
                    holdingQuantity={holdings.find(h => h.stockId === selectedHolding.stockId)?.quantity || 0}
                />
            )}
        </>
    );
}
