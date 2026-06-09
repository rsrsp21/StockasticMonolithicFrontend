import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { createSip, updateSip } from '../../services/sipService';
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../utils/utils";
import { format } from "date-fns";
import { isTradingDay } from "../../utils/marketUtils";

export function SipModal({ isOpen, onClose, stock, currentPrice, onSuccess, initialData }) {
    const isEditMode = !!initialData;
    const [quantity, setQuantity] = useState(1);
    const [frequency, setFrequency] = useState('MONTHLY');
    const getStartOfToday = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    };
    const isSelectableSipDate = (date) => date > getStartOfToday() && isTradingDay(date);
    const getNextTradingDay = () => {
        const d = getStartOfToday();
        do {
            d.setDate(d.getDate() + 1);
        } while (!isTradingDay(d));
        return new Date(d);
    };
    const [startDate, setStartDate] = useState(getNextTradingDay());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setQuantity(initialData.quantity);
            setFrequency(initialData.frequency);
            setStartDate(new Date(initialData.startDate));
        } else {
            setQuantity(1);
            setFrequency('MONTHLY');
            setStartDate(getNextTradingDay());
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!isEditMode && !isSelectableSipDate(startDate)) {
            toast.error("Select a future trading day (no today/weekend/holiday)");
            setIsLoading(false);
            return;
        }
        if (isEditMode) {
            const original = new Date(initialData?.startDate);
            original.setHours(0, 0, 0, 0);
            const selected = new Date(startDate);
            selected.setHours(0, 0, 0, 0);
            const isChanged = selected.getTime() !== original.getTime();
            if (isChanged && !isSelectableSipDate(startDate)) {
                toast.error("Select a future trading day (no today/weekend/holiday)");
                setIsLoading(false);
                return;
            }
        }

        try {
            const sipData = {
                stockId: stock?.stockId || initialData?.stock?.stockId,
                frequency,
                quantity: parseInt(quantity),
                startDate: format(startDate, 'yyyy-MM-dd')
            };

            if (isEditMode) {
                await updateSip(initialData.id, sipData);
                toast.success("SIP updated successfully!");
            } else {
                await createSip(sipData);
                toast.success("SIP scheduled successfully!");
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to save SIP:", error);
            toast.error(error.response?.data?.message || "Failed to save SIP");
        } finally {
            setIsLoading(false);
        }
    };

    const priceToUse = currentPrice || initialData?.stock?.currentPrice || 0;
    const estimatedAmount = (quantity * priceToUse).toFixed(2);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit SIP' : 'Start SIP'} in {stock?.symbol || initialData?.stock?.symbol}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Update your systematic investment plan.' : `Schedule periodic investments for ${stock?.name}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Price</Label>
                        <div className="col-span-3 font-semibold">₹{priceToUse?.toFixed(2)}</div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="frequency" className="text-right">Frequency</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                    disabled={(date) => {
                                        const localDate = new Date(date);
                                        localDate.setHours(0, 0, 0, 0);

                                        if (isEditMode && initialData?.startDate) {
                                            const original = new Date(initialData.startDate);
                                            original.setHours(0, 0, 0, 0);
                                            if (localDate.getTime() === original.getTime()) {
                                                return false;
                                            }
                                        }

                                        return !isSelectableSipDate(localDate);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground mt-2">
                        <p>Estimated Amount per {frequency.toLowerCase()}: <span className="font-bold text-foreground">₹{estimatedAmount}</span></p>
                        <p className="text-xs mt-1">Actual amount will vary based on market price at execution time (9:15 AM).</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm SIP
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
