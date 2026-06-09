import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Zap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { MESSAGES } from "../../utils/constants/messages";

export function AutoSellModal({ stockId, symbol, currentPrice }) {
    const [open, setOpen] = useState(false);
    const [targetPrice, setTargetPrice] = useState("");
    const [stopLoss, setStopLoss] = useState("");
    const [quantity, setQuantity] = useState("");
    const [availableQty, setAvailableQty] = useState(0);
    const [loading, setLoading] = useState(false);

    // Existing rules state
    const [existingRules, setExistingRules] = useState([]);
    const [loadingRules, setLoadingRules] = useState(false);

    useEffect(() => {
        if (stockId) {
            fetchData();
        }
    }, [open, stockId]);

    const fetchData = async () => {
        setLoadingRules(true);
        try {
            // 1. Fetch Existing Rules
            const rulesRes = await axiosInstance.get(API_ENDPOINTS.AUTOSELL.BASE);
            const rulesForStock = rulesRes.data.filter(r => r.stockId === stockId && r.active);
            setExistingRules(rulesForStock);

            // 2. Fetch User Holdings for this stock
            const holdingsRes = await axiosInstance.get(API_ENDPOINTS.ORDERS.HOLDING_BY_STOCK(stockId));

            if (holdingsRes.status === 204) {
                setAvailableQty(0);
            } else {
                setAvailableQty(holdingsRes.data ? holdingsRes.data.quantity : 0);
            }

        } catch (error) {
            // Check specifically for 404 on holdings which might just mean no holdings
            if (error.response?.config?.url?.includes(API_ENDPOINTS.ORDERS.HOLDINGS)) {
                setAvailableQty(0);
            } else {
                console.error("Failed to fetch data", error);
            }
        } finally {
            setLoadingRules(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (availableQty <= 0) {
            toast.error(MESSAGES.VALIDATION.NO_SHARES);
            return;
        }

        if ((!targetPrice && !stopLoss)) {
            toast.error(MESSAGES.VALIDATION.CONDITION_REQUIRED);
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            toast.error(MESSAGES.VALIDATION.QUANTITY_INVALID);
            return;
        }

        if (Number(quantity) > availableQty) {
            toast.error(`You only own ${availableQty} shares.`);
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.AUTOSELL.BASE, {
                stockId,
                targetPrice: targetPrice ? Number(targetPrice) : null,
                stopLoss: stopLoss ? Number(stopLoss) : null,
                quantity: Number(quantity)
            });

            toast.success(`Auto-sell rule configured for ${symbol}`);
            setTargetPrice("");
            setStopLoss("");
            setQuantity("");
            fetchData(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(error.message || MESSAGES.ERROR.GENERIC);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (ruleId) => {
        try {
            await axiosInstance.delete(API_ENDPOINTS.AUTOSELL.BY_ID(ruleId));
            toast.success(MESSAGES.SUCCESS.AUTOSELL.DELETED);
            setExistingRules(prev => prev.filter(r => r.ruleId !== ruleId));
        } catch (error) {
            console.error(error);
            toast.error(MESSAGES.ERROR.AUTOSELL.DELETE_FAILED);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-2 ${existingRules.length > 0 ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-orange-500/20 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/40"}`}>
                    <Zap className={`h-4 w-4 ${existingRules.length > 0 ? "fill-orange-400" : ""}`} />
                    {existingRules.length > 0 ? "Auto-Sell Active" : "Auto-Sell"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-card border-border/40 text-foreground">
                <DialogHeader>
                    <DialogTitle>Configure Auto-Sell</DialogTitle>
                    <DialogDescription>
                        Automatically sell {symbol} when it hits a target.
                    </DialogDescription>
                </DialogHeader>

                {/* Existing Rules Section */}
                {existingRules.length > 0 && (
                    <div className="mb-4 space-y-2">
                        <Label>Active Rule</Label>
                        <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                            {existingRules.map(rule => (
                                <div key={rule.ruleId} className="flex flex-col gap-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            {rule.targetPrice && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-green-400 border-green-400 text-[10px] h-5">Target</Badge>
                                                    <span className="font-mono">≥ ₹{rule.targetPrice}</span>
                                                </div>
                                            )}
                                            {rule.stopLoss && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-red-400 border-red-400 text-[10px] h-5">Stop Loss</Badge>
                                                    <span className="font-mono">≤ ₹{rule.stopLoss}</span>
                                                </div>
                                            )}
                                            {rule.quantity && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-blue-400 border-blue-400 text-[10px] h-5">Qty</Badge>
                                                    <span className="font-mono">{rule.quantity} shares</span>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 self-start"
                                            onClick={() => handleDelete(rule.ruleId)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid gap-4 py-4 border-t border-border/40 pt-4">

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="as-quantity" className="text-right">
                            Quantity
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="as-quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="bg-muted/30 border-border/40"
                                placeholder={`Max: ${availableQty}`}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Available: {availableQty} shares</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="as-current" className="text-right">
                            Current
                        </Label>
                        <Input
                            id="as-current"
                            value={currentPrice}
                            disabled
                            className="col-span-3 bg-muted/30 border-border/40"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="take-profit" className="text-right text-green-400">
                            Take Profit
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="take-profit"
                                type="number"
                                step="0.01"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                className="bg-muted/30 border-border/40"
                                placeholder="Sell if price >= X"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Goal: Lock in profits</p>
                        </div>

                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stop-loss" className="text-right text-red-400">
                            Stop Loss
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="stop-loss"
                                type="number"
                                step="0.01"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(e.target.value)}
                                className="bg-muted/30 border-border/40"
                                placeholder="Sell if price <= Y"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Safety: Limit your losses</p>
                        </div>

                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={loading || availableQty <= 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {loading ? "Saving..." : "Set Rule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
