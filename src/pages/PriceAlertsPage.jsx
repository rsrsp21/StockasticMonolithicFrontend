import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Trash2, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, History, Clock, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { cn } from "../utils/utils";
import axiosInstance from "../api/axios";
import { API_ENDPOINTS } from "../utils/constants/endpoints";
import { MESSAGES } from "../utils/constants/messages";
import { Skeleton } from "../components/ui/skeleton";
import { Pagination } from "../components/common/Pagination";
import { usePageTitle } from "../hooks/usePageTitle";
import { useState } from "react";


export default function PriceAlertsPage() {
    usePageTitle("Price Alerts");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [historyPage, setHistoryPage] = useState(0);
    const PAGE_SIZE = 10;

    // Active Alerts Query
    const {
        data: activeData,
        isLoading: loading,
        isFetching: isFetchingActive,
        refetch: refetchActive
    } = useQuery({
        queryKey: ['priceAlerts', 'active', currentPage],
        queryFn: async () => {
            const res = await axiosInstance.get(API_ENDPOINTS.ALERTS.PAGED, {
                params: {
                    page: currentPage,
                    size: PAGE_SIZE,
                    sortBy: "createdAt",
                    sortDir: "desc",
                    isActive: true
                }
            });
            return res.data;
        },
        keepPreviousData: true,
        staleTime: 30000, // 30 seconds
    });

    // History Alerts Query
    const {
        data: historyData,
        isLoading: loadingHistory,
        isFetching: isFetchingHistory,
        refetch: refetchHistory
    } = useQuery({
        queryKey: ['priceAlerts', 'history', historyPage],
        queryFn: async () => {
            const res = await axiosInstance.get(API_ENDPOINTS.ALERTS.PAGED, {
                params: {
                    page: historyPage,
                    size: PAGE_SIZE,
                    sortBy: "triggeredAt",
                    sortDir: "desc",
                    isActive: false
                }
            });
            return res.data;
        },
        enabled: showHistory,
        keepPreviousData: true,
        staleTime: 60000, // 1 minute
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => axiosInstance.delete(API_ENDPOINTS.ALERTS.BY_ID(id)),
        onSuccess: () => {
            queryClient.invalidateQueries(['priceAlerts', 'active']);
            toast.success(MESSAGES.SUCCESS.ALERTS.DELETED);
        },
        onError: () => {
            toast.error(MESSAGES.ERROR.ALERTS.DELETE_FAILED);
        }
    });

    const alerts = activeData?.content || [];
    const totalPages = activeData?.totalPages || 0;
    const totalElements = activeData?.totalElements || 0;

    const historyAlerts = historyData?.content || [];
    const historyTotalPages = historyData?.totalPages || 0;
    const historyTotalElements = historyData?.totalElements || 0;

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleHistoryPageChange = (newPage) => {
        setHistoryPage(newPage);
    };

    const handleRefresh = () => {
        refetchActive();
        if (showHistory) {
            refetchHistory();
        }
    };

    const handleDelete = (id) => {
        deleteMutation.mutate(id);
    };

    const isRefreshing = isFetchingActive || isFetchingHistory;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <BellRing className="h-7 w-7 text-primary" />
                        Price Alerts
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your price targets.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/explore')} variant="outline" size="sm" className="gap-2">
                        <TrendingUp className="h-4 w-4" /> Explore Stocks
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2" disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Refresh
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary/30">
                                <TableHead>Stock</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead className="text-right">Target Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4].map(i => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active Alerts Section */}
                    {alerts.length === 0 ? (
                        <div className="text-center py-12 glass-card">
                            <BellRing className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-lg font-medium text-foreground">No alerts</h3>
                            <p className="text-muted-foreground mb-4">You haven't set any price alerts yet.</p>
                            <Button onClick={() => navigate('/explore')} variant="outline" size="sm">
                                Explore Stocks
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <div className="px-4 py-3 bg-secondary/30 border-b border-border">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <BellRing className="h-4 w-4 text-primary" /> Active Alerts
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-secondary/10">
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Condition</TableHead>
                                            <TableHead className="text-right">Target Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {alerts.map(alert => (
                                            <TableRow
                                                key={alert.alertId}
                                                className="cursor-pointer transition-colors hover:bg-secondary/20"
                                                onClick={() => navigate(`/stock/${alert.stockId}`)}
                                            >
                                                <TableCell>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{alert.symbol}</p>
                                                        <p className="text-xs text-muted-foreground">{alert.stockName}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {alert.condition === 'ABOVE'
                                                            ? <TrendingUp className="h-4 w-4 text-green-500" />
                                                            : <TrendingDown className="h-4 w-4 text-red-500" />
                                                        }
                                                        <span className={cn(
                                                            "font-medium text-sm",
                                                            alert.condition === 'ABOVE' ? "text-green-500" : "text-red-500"
                                                        )}>
                                                            {alert.condition}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-medium">
                                                    ₹{alert.targetPrice?.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-xs text-nowrap">
                                                        Active
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                                        onClick={() => handleDelete(alert.alertId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {alerts.length > 0 && (
                                <div className="border-t border-border">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalElements={totalElements}
                                        pageSize={PAGE_SIZE}
                                        onPageChange={handlePageChange}
                                        itemLabel="alerts"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* History Section (Always Visible) */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/10 transition-colors"
                        >
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <History className="h-4 w-4 text-muted-foreground" /> Show History
                            </h3>
                            {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>

                        {showHistory && (
                            <div className="border-t border-border animate-fade-in-down">
                                {(loadingHistory || (isFetchingHistory && historyAlerts.length === 0)) ? (
                                    <div className="p-8 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/50" />
                                        <p className="text-sm text-muted-foreground mt-2">Loading history...</p>
                                    </div>
                                ) : historyAlerts.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-secondary/10">
                                                    <TableHead>Stock</TableHead>
                                                    <TableHead>Condition</TableHead>
                                                    <TableHead className="text-right">Target Price</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right text-nowrap"><Clock className="h-3 w-3 inline mr-1" /> Triggered At</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {historyAlerts.map(alert => (
                                                    <TableRow
                                                        key={alert.alertId}
                                                        className="opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all cursor-pointer"
                                                        onClick={() => navigate(`/stock/${alert.stockId}`)}
                                                    >
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-semibold text-foreground italic">{alert.symbol}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs text-muted-foreground uppercase">{alert.condition}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-sm">
                                                            ₹{alert.targetPrice?.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-muted-foreground/30 text-[10px] py-0">
                                                                Triggered
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs text-muted-foreground">
                                                            {new Date(alert.triggeredAt).toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <Pagination
                                            currentPage={historyPage}
                                            totalPages={historyTotalPages}
                                            totalElements={historyTotalElements}
                                            pageSize={PAGE_SIZE}
                                            onPageChange={handleHistoryPageChange}
                                            itemLabel="history items"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground italic text-sm">
                                        No history found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

