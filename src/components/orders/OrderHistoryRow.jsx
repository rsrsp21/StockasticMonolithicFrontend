import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog";
import { X, Clock, AlertTriangle } from "lucide-react";

/**
 * Order History Row component - displays a single order with status and cancel option.
 */
export function OrderHistoryRow({ order, onCancel, isLoading }) {
    const {
        orderId,
        symbol,
        stockName,
        orderType,
        orderMode,
        status,
        quantity,
        price,
        totalAmount,
        createdAt
    } = order;

    const [dialogOpen, setDialogOpen] = useState(false);

    const isBuy = orderType === 'BUY';
    const isPending = status === 'PENDING';

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'FILLED':
                return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Filled</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
            case 'PARTIALLY_FILLED':
                return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Partial</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cancelled</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleConfirmCancel = () => {
        onCancel?.(orderId);
        setDialogOpen(false);
    };

    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/35 transition-all">
            {/* Order Info */}
            <div className="flex items-center gap-4">
                {/* Type Badge */}
                <div className={`px-2 py-1 rounded text-xs font-bold ${isBuy
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-red-500/20 text-red-500'
                    }`}>
                    {orderType}
                </div>

                {/* Stock Info */}
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{symbol}</span>
                        <span className="text-xs text-muted-foreground">×{quantity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(createdAt)}</span>
                        <span>•</span>
                        <span>{orderMode}</span>
                    </div>
                </div>
            </div>

            {/* Price & Status */}
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="font-semibold">{formatCurrency(totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">@ {formatCurrency(price)}</p>
                </div>

                {getStatusBadge(status)}

                {/* Cancel Button with Confirmation Dialog for Pending Orders */}
                {isPending && (
                    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-500/10 hover:text-red-400 gap-1.5"
                                disabled={isLoading}
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-border/40 bg-card">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    Cancel Order?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to cancel this order?
                                    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground font-medium">{symbol}</span>
                                            <span className={`text-xs font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                                                {orderType}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1 text-sm">
                                            <span>{quantity} shares @ {formatCurrency(price)}</span>
                                            <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                                        </div>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="border-border/40">Keep Order</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleConfirmCancel}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Yes, Cancel Order
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
}
