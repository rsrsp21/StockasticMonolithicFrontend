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
import { BellRing, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { MESSAGES } from "../../utils/constants/messages";

export function PriceAlertModal({ stockId, symbol, currentPrice }) {
    const [open, setOpen] = useState(false);
    const [targetPrice, setTargetPrice] = useState("");
    const [loading, setLoading] = useState(false);

    // Existing alerts state
    const [existingAlerts, setExistingAlerts] = useState([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);

    // Derived condition based on target vs current
    const condition = targetPrice && Number(targetPrice) > currentPrice ? "ABOVE" : "BELOW";

    useEffect(() => {
        if (stockId) {
            fetchExistingAlerts();
        }
    }, [stockId, open]);

    const fetchExistingAlerts = async () => {
        setLoadingAlerts(true);
        try {
            const res = await axiosInstance.get(API_ENDPOINTS.ALERTS.BASE);
            // Filter for THIS stock
            const alertsForStock = res.data.filter(a => a.stockId === stockId && a.active);
            setExistingAlerts(alertsForStock);
        } catch (error) {
            console.error("Failed to fetch alerts", error);
        } finally {
            setLoadingAlerts(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!targetPrice || isNaN(targetPrice)) {
            toast.error(MESSAGES.VALIDATION.PRICE_INVALID);
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post(API_ENDPOINTS.ALERTS.BASE, {
                stockId,
                targetPrice: Number(targetPrice),
                condition
            });

            toast.success(`Alert set for ${symbol} @ ${targetPrice}`);
            setTargetPrice("");
            fetchExistingAlerts(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(MESSAGES.ERROR.ALERTS.CREATE_FAILED);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (alertId) => {
        try {
            await axiosInstance.delete(API_ENDPOINTS.ALERTS.BY_ID(alertId));
            toast.success(MESSAGES.SUCCESS.ALERTS.DELETED);
            setExistingAlerts(prev => prev.filter(a => a.alertId !== alertId));
        } catch (error) {
            console.error(error);
            toast.error(MESSAGES.ERROR.ALERTS.DELETE_FAILED);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`gap-2 ${existingAlerts.length > 0 ? "border-primary text-primary bg-primary/10" : ""}`}>
                    <BellRing className={`h-4 w-4 ${existingAlerts.length > 0 ? "fill-primary" : ""}`} />
                    {existingAlerts.length > 0 ? "Alert Active" : "Set Alert"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-card border-border/40 text-foreground">
                <DialogHeader>
                    <DialogTitle>Price Alerts for {symbol}</DialogTitle>
                    <DialogDescription>
                        Set a new target price or manage existing alerts.
                    </DialogDescription>
                </DialogHeader>

                {/* Existing Alerts Section */}
                {existingAlerts.length > 0 && (
                    <div className="mb-4 space-y-2">
                        <Label>Active Alerts</Label>
                        <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                            {existingAlerts.map(alert => (
                                <div key={alert.alertId} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={alert.condition === "ABOVE" ? "text-green-400 border-green-400" : "text-red-400 border-red-400"}>
                                            {alert.condition}
                                        </Badge>
                                        <span className="font-mono font-medium">₹{alert.targetPrice}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                        onClick={() => handleDelete(alert.alertId)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid gap-4 py-4 border-t border-border/40 pt-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="current" className="text-right">
                            Current
                        </Label>
                        <Input
                            id="current"
                            value={currentPrice}
                            disabled
                            className="col-span-3 bg-muted/30 border-border/40"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="target" className="text-right">
                            Target
                        </Label>
                        <Input
                            id="target"
                            type="number"
                            step="0.01"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            className="col-span-3 bg-muted/30 border-border/40"
                            placeholder="Enter price"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Condition</Label>
                        <div className="col-span-3 text-sm text-muted-foreground">
                            Alert when price goes <strong>{condition}</strong> {targetPrice || "..."}
                        </div>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {loading ? "Saving..." : "Create Alert"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
