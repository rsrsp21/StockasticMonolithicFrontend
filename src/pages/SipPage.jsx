import { useState, useEffect, useMemo } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { getUserSips, getSipHistory, toggleSipStatus } from "../services/sipService";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Loader2, Play, Pause, XCircle, Edit2, CalendarDays, TrendingUp, AlertCircle, History, CalendarClock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { SipModal } from "../components/sip/SipModal";
import { API_ENDPOINTS } from "../utils/constants/endpoints";
import { useNavigate } from "react-router-dom";
import { RefreshButton } from "../components/common/RefreshButton";
import { useMultipleStocksWebSocket } from "../hooks/useMultipleStocksWebSocket";
import { isMarketOpen as checkMarketOpen, getMillisecondsUntilNextMarketChange } from "../utils/marketUtils";

import { Skeleton, SkeletonTable } from "../components/ui/skeleton";

const SipCardSkeleton = () => (
    <Card className="overflow-hidden border-l-4 border-l-muted hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </CardHeader>
        <CardContent className="pb-3 text-sm space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </CardContent>
        <CardFooter className="pt-3 border-t bg-muted/20 flex gap-2 justify-end">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
        </CardFooter>
    </Card>
);

export default function SipPage() {
    usePageTitle("My SIPs");
    const navigate = useNavigate();

    const [sips, setSips] = useState([]);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSip, setSelectedSip] = useState(null);

    // Market Status
    const [isMarketOpen, setIsMarketOpen] = useState(false);
    const activeSips = sips.filter((sip) => sip.status === "ACTIVE");
    const cancelledSips = sips.filter((sip) => sip.status === "CANCELLED");

    useEffect(() => {
        let timer;
        const checkAndScheduleNext = () => {
            const open = checkMarketOpen();
            setIsMarketOpen(open);
            const msUntilChange = getMillisecondsUntilNextMarketChange();
            if (msUntilChange !== null) {
                timer = setTimeout(checkAndScheduleNext, msUntilChange);
            }
        };
        checkAndScheduleNext();
        return () => clearTimeout(timer);
    }, []);

    // WebSocket: subscribe to all unique stock IDs from SIPs
    const sipStockIds = useMemo(() => {
        const ids = sips.map(sip => sip.stock?.stockId).filter(Boolean);
        return [...new Set(ids)];
    }, [sips]);

    const { prices: livePrices } = useMultipleStocksWebSocket(sipStockIds, isMarketOpen);

    // Helper to get the effective price for a SIP's stock
    const getEffectivePrice = (sip) => {
        const live = livePrices[sip.stock?.stockId];
        if (live) return live.price;
        return sip.stock?.currentPrice;
    };

    // Initial Fetch
    useEffect(() => {
        fetchSips();
    }, []);

    const fetchSips = async () => {
        setIsLoading(true);
        try {
            const data = await getUserSips();
            setSips(data);
        } catch (error) {
            console.error("Failed to fetch SIPs", error);
            toast.error("Failed to load SIPs");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchSips();
        if (history.length > 0) {
            await fetchHistory();
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            // Fetching page 0, size 50 for now
            const data = await getSipHistory(0, 50);
            setHistory(data.content);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleTabChange = (value) => {
        if (value === "history" && history.length === 0) {
            fetchHistory();
        }
    };

    const handleStatusChange = async (sipId, newStatus) => {
        try {
            await toggleSipStatus(sipId, newStatus);
            toast.success(`SIP ${newStatus.toLowerCase()} successfully`);
            fetchSips(); // Refresh list
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleEdit = (sip) => {
        setSelectedSip(sip);
        setShowEditModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "ACTIVE": return "default"; // black/white
            case "PAUSED": return "warning"; // yellow-ish usually, or secondary
            case "CANCELLED": return "destructive";
            case "COMPLETED": return "outline";
            default: return "secondary";
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <CalendarClock className="h-7 w-7 text-primary" />
                        Systematic Investment Plans
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your recurring investments and track history.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate("/explore")} variant="outline" size="sm" className="gap-2">
                        <TrendingUp className="h-4 w-4" /> Explore Stocks
                    </Button>
                    <RefreshButton
                        onClick={handleRefresh}
                        isLoading={isLoading || historyLoading}
                        size="sm"
                    />
                </div>
            </div>

            <Tabs defaultValue="active" onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="active">Active Plans</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled Plans</TabsTrigger>
                    <TabsTrigger value="history">Transaction History</TabsTrigger>
                </TabsList>

                {/* ACTIVE SIPS TAB */}
                <TabsContent value="active" className="mt-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <SipCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : activeSips.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-card/50 border-dashed">
                            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">No Active SIPs</h3>
                            <p className="text-muted-foreground mb-6">Start building wealth by creating a new SIP from any stock page.</p>
                            <Button onClick={() => navigate("/explore")}>Start Investing</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeSips.map((sip) => {
                                const effectivePrice = getEffectivePrice(sip);
                                return (
                                    <Card
                                        key={sip.id}
                                        className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/stock/${sip.stock?.stockId}`)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                                                        {sip.stock.image ? (
                                                            <img src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${sip.stock.image}`} alt={sip.stock.symbol} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="font-bold">{sip.stock.symbol.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{sip.stock.symbol}</CardTitle>
                                                        <CardDescription>{sip.stock.name}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant={getStatusColor(sip.status)}>{sip.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3 text-sm space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Quantity</span>
                                                <span className="font-medium">{sip.quantity}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Frequency</span>
                                                <span className="font-medium capitalize">{sip.frequency.toLowerCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Next Due</span>
                                                <span className="font-medium">{format(new Date(sip.nextExecutionDate), "PPP")}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Current Price</span>
                                                <span className="font-medium">₹{effectivePrice?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 mt-1">
                                                <span className="text-muted-foreground font-medium">Est. Amount</span>
                                                <span className="font-bold text-primary">₹{effectivePrice ? (sip.quantity * effectivePrice).toLocaleString() : "—"}</span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-3 border-t bg-muted/20 flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                            {sip.status === 'ACTIVE' ? (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sip)} title="Edit SIP">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(sip.id, 'PAUSED')} className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100" title="Pause SIP">
                                                        <Pause className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(sip.id, 'CANCELLED')} className="text-red-600 hover:text-red-700 hover:bg-red-100" title="Cancel SIP">
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : sip.status === 'PAUSED' ? (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sip)} title="Edit SIP">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(sip.id, 'ACTIVE')} className="text-green-600 hover:text-green-700 hover:bg-green-100" title="Resume SIP">
                                                        <Play className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(sip.id, 'CANCELLED')} className="text-red-600 hover:text-red-700 hover:bg-red-100" title="Cancel SIP">
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">SIP Cancelled</span>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* CANCELLED SIPS TAB */}
                <TabsContent value="cancelled" className="mt-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <SipCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : cancelledSips.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-card/50 border-dashed">
                            <XCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">No Cancelled SIPs</h3>
                            <p className="text-muted-foreground mb-2">Cancelled plans will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cancelledSips.map((sip) => {
                                const effectivePrice = getEffectivePrice(sip);
                                return (
                                    <Card
                                        key={sip.id}
                                        className="overflow-hidden border-l-4 border-l-red-500/70 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/stock/${sip.stock?.stockId}`)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                                                        {sip.stock.image ? (
                                                            <img src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${sip.stock.image}`} alt={sip.stock.symbol} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="font-bold">{sip.stock.symbol.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{sip.stock.symbol}</CardTitle>
                                                        <CardDescription>{sip.stock.name}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant="destructive">CANCELLED</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3 text-sm space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Quantity</span>
                                                <span className="font-medium">{sip.quantity}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Frequency</span>
                                                <span className="font-medium capitalize">{sip.frequency.toLowerCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Last Due</span>
                                                <span className="font-medium">{format(new Date(sip.nextExecutionDate), "PPP")}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 mt-1">
                                                <span className="text-muted-foreground font-medium">Reference Price</span>
                                                <span className="font-bold text-primary">₹{effectivePrice ? effectivePrice.toLocaleString() : "—"}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" /> Transaction History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {historyLoading ? (
                                <SkeletonTable rows={5} columns={5} />
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No history available</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{format(new Date(tx.executionDate), "PP p")}</TableCell>
                                                <TableCell className="font-medium">{tx.stockSymbol}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        tx.status === 'SUCCESS' ? 'default' :
                                                            tx.status === 'FAILED' ? 'destructive' : 'secondary'
                                                    }>
                                                        {tx.status.replace(/_/g, " ")}
                                                    </Badge>
                                                    {tx.failureReason && (
                                                        <span className="ml-2 text-xs text-muted-foreground flex items-center gap-1 inline-flex" title={tx.failureReason}>
                                                            <AlertCircle className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">{tx.quantity || "—"}</TableCell>
                                                <TableCell className="text-right">{tx.price ? `₹${tx.price.toFixed(2)}` : "—"}</TableCell>
                                                <TableCell className="text-right">
                                                    {tx.price && tx.quantity ? `₹${(tx.price * tx.quantity).toFixed(2)}` : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Modal */}
            {selectedSip && (
                <SipModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedSip(null);
                    }}
                    stock={selectedSip.stock}
                    initialData={selectedSip}
                    currentPrice={getEffectivePrice(selectedSip)}
                    onSuccess={fetchSips}
                />
            )}
        </div>
    );
}
