import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Loader2, Plus, Minus, TrendingUp, TrendingDown, AlertTriangle, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { ordersApi } from "../../api/ordersApi";
import { walletApi } from "../../api/walletApi";

/**
 * Buy/Sell Modal for placing stock orders.
 * Supports Market and Limit order types with quantity controls.
 * Fetches wallet data internally for BUY orders.
 */
export function BuySellModal({
    isOpen,
    onOpenChange,
    stock,
    currentPrice = 0,
    isMarketOpen = true,
    orderType = 'BUY', // 'BUY' or 'SELL'
    onSuccess,
    holdingQuantity = 0
}) {
    const [step, setStep] = useState(1);
    const [quantity, setQuantity] = useState('');
    const [orderMode, setOrderMode] = useState('MARKET');
    const [limitPrice, setLimitPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [orderResult, setOrderResult] = useState(null);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);

    const isBuy = orderType === 'BUY';

    // Fetch wallet data when modal opens for BUY orders
    useEffect(() => {
        if (isOpen && isBuy) {
            setIsLoadingWallet(true);
            walletApi.getWallet()
                .then((wallet) => {
                    setAvailableBalance((wallet?.availableBalance || 0) + (wallet?.lockedBalance || 0));
                })
                .catch((err) => {
                    console.error("Failed to fetch wallet:", err);
                    setAvailableBalance(0);
                })
                .finally(() => {
                    setIsLoadingWallet(false);
                });
        }
    }, [isOpen, isBuy]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setQuantity('');
            setOrderMode('MARKET');
            setLimitPrice(currentPrice?.toFixed(2) || '');
            setIsLoading(false);
            setOrderResult(null);
        }
        // Removed currentPrice from dependency to prevent reset while typing
    }, [isOpen, orderType]);

    const handleOpenChange = (open) => {
        onOpenChange(open);
    };

    // Calculate total amount
    const parsedQuantity = parseInt(quantity, 10);
    const isQuantityValid = Number.isInteger(parsedQuantity) && parsedQuantity > 0;
    const effectivePrice = orderMode === 'LIMIT' ? parseFloat(limitPrice) || 0 : currentPrice;
    const totalAmount = effectivePrice * (isQuantityValid ? parsedQuantity : 0);

    // Validation
    const hasInsufficientFunds = isBuy && isQuantityValid && totalAmount > availableBalance;
    const hasInsufficientHoldings = !isBuy && isQuantityValid && parsedQuantity > holdingQuantity;
    const isInvalid = hasInsufficientFunds || hasInsufficientHoldings;
    const isQuantityMissing = !quantity;

    // Quantity controls
    const incrementQty = () => {
        const next = isQuantityValid ? parsedQuantity + 1 : 1;
        setQuantity(String(next));
    };
    const decrementQty = () => {
        if (!isQuantityValid || parsedQuantity <= 1) return;
        setQuantity(String(parsedQuantity - 1));
    };

    const handleQuantityChange = (e) => {
        const value = e.target.value;
        if (value === '') {
            setQuantity('');
            return;
        }
        if (/^\d+$/.test(value)) {
            setQuantity(value);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    const isSubmitting = useRef(false);

    // Place order
    const handlePlaceOrder = async () => {
        if (isSubmitting.current) return;
        if (!isQuantityValid) {
            toast.error("Quantity is required");
            return;
        }
        isSubmitting.current = true;
        setIsLoading(true);
        try {
            const orderData = {
                stockId: stock.stockId,
                orderType: orderType,
                orderMode: orderMode,
                quantity: parsedQuantity,
                price: orderMode === 'LIMIT' ? parseFloat(limitPrice) : null
            };

            const result = await ordersApi.placeOrder(orderData);

            // Auto-close and toast
            onOpenChange(false);
            toast.success(`${orderType === 'BUY' ? 'Bought' : 'Sold'} ${parsedQuantity} ${stock.symbol} successfully!`);

            if (onSuccess) {
                onSuccess(result);
            }
        } catch (error) {
            console.error("Failed to place order:", error);
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            setIsLoading(false);
            // Small delay to prevent edge case double clicks
            setTimeout(() => {
                isSubmitting.current = false;
            }, 500);
        }
    };

    // ... (GetStatusBadge helper if needed, preserved if outside replaced block or removed if inside)
    // Actually I am replacing up to DialogFooter end.

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="glass-card border-border/40 sm:max-w-[440px] p-0 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/30">
                    <DialogTitle className="flex items-center gap-2">
                        {isBuy ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        {isBuy ? 'Buy' : 'Sell'} {stock?.symbol}
                    </DialogTitle>
                    <DialogDescription>
                        {stock?.name} • {formatCurrency(currentPrice)}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 animate-fade-in">
                    {/* ... AMO Warning ... */}
                    {!isMarketOpen && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-500">After Market Order (AMO)</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Market is closed. Your order will be placed when market opens.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Order Mode Toggle */}
                    <div className="space-y-2">
                        <Label>Order Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {['MARKET', 'LIMIT'].map((mode) => (
                                <Button
                                    key={mode}
                                    type="button"
                                    variant={orderMode === mode ? "default" : "outline"}
                                    className={orderMode === mode ? "" : "border-border/40"}
                                    onClick={() => setOrderMode(mode)}
                                >
                                    {mode === 'MARKET' ? 'Market' : 'Limit'}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Limit Price Input */}
                    {orderMode === 'LIMIT' && (
                        <div className="space-y-2 animate-fade-in">
                            <Label>Limit Price (₹)</Label>
                            <Input
                                type="number"
                                placeholder="Enter limit price"
                                className="glass-input text-lg"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                min="0.01"
                                step="0.01"
                            />
                        </div>
                    )}

                    {/* Quantity Controls */}
                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-border/40"
                                onClick={decrementQty}
                                disabled={!isQuantityValid || parsedQuantity <= 1}
                            >
                                <Minus className="h-5 w-5" />
                            </Button>
                            <Input
                                type="number"
                                className="glass-input text-center text-xl font-bold h-12 flex-1"
                                value={quantity}
                                onChange={handleQuantityChange}
                                min="1"
                                placeholder="Required"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-border/40"
                                onClick={incrementQty}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        {/* Quick quantity buttons */}
                        <div className="flex gap-2 mt-2">
                            {[1, 5, 10, 25, 50].map((q) => (
                                <Button
                                    key={q}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs border-border/40"
                                    onClick={() => setQuantity(String(q))}
                                >
                                    {q}
                                </Button>
                            ))}
                        </div>
                        {isQuantityMissing && (
                            <p className="text-xs text-red-500">Quantity is required.</p>
                        )}
                    </div>

                    {/* Order Summary & Validation */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price per share</span>
                            <span>{formatCurrency(effectivePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Quantity</span>
                            <span>{isQuantityValid ? parsedQuantity : 0} shares</span>
                        </div>
                        <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                            <span className="font-semibold">Total {isBuy ? 'Cost' : 'Value'}</span>
                            <div className="text-right">
                                <span className="text-lg font-bold block">{formatCurrency(totalAmount)}</span>
                                {/* Balance/Holdings Check */}
                                {isBuy ? (
                                    <span className={`text-xs ${hasInsufficientFunds ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                        Available: {formatCurrency(availableBalance)}
                                    </span>
                                ) : (
                                    <span className={`text-xs ${hasInsufficientHoldings ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                        Held: {holdingQuantity}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isInvalid && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-md">
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                                {hasInsufficientFunds ? "Insufficient funds in wallet" : "Insufficient holdings to sell"}
                            </span>
                        </div>
                    )}

                </div>
                <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                    <Button
                        className={`w-full h-12 text-base font-semibold ${isBuy
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                            }`}
                        onClick={handlePlaceOrder}
                        disabled={isLoading || (orderMode === 'LIMIT' && !limitPrice) || isInvalid || !isQuantityValid}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : null}
                        {isBuy ? 'Buy' : 'Sell'} {isQuantityValid ? parsedQuantity : 0} {stock?.symbol}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


