import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";
import { bankAccountApi } from "../../api/walletApi";

export function BankLinkModal({ isOpen, onOpenChange, onLinkSuccess }) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [bankForm, setBankForm] = useState({
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        holderName: ""
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!bankForm.bankName.trim()) {
            newErrors.bankName = "Bank name is required";
        }

        if (!bankForm.accountNumber.trim()) {
            newErrors.accountNumber = "Account number is required";
        } else if (!/^\d{9,18}$/.test(bankForm.accountNumber)) {
            newErrors.accountNumber = "Account number must be 9-18 digits";
        }

        if (!bankForm.ifscCode.trim()) {
            newErrors.ifscCode = "IFSC code is required";
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankForm.ifscCode)) {
            newErrors.ifscCode = "Invalid IFSC format";
        }

        if (!bankForm.holderName.trim()) {
            newErrors.holderName = "Account holder name is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLinkBank = async () => {
        if (!validateForm()) {
            toast.error(MESSAGES.ERROR.FIX_ERRORS);
            return;
        }

        setIsLoading(true);
        setStep(2);

        try {
            await bankAccountApi.linkBankAccount(bankForm);
            setStep(3);
            // Notify parent of success
            setTimeout(() => {
                if (onLinkSuccess) onLinkSuccess();
            }, 1500);
        } catch (error) {
            setStep(1);
            console.error("Failed to link bank account:", error);
            toast.error(error.response?.data?.message || MESSAGES.ERROR.GENERIC);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (open) => {
        onOpenChange(open);
        if (!open) {
            setStep(1);
            setBankForm({
                bankName: "",
                accountNumber: "",
                ifscCode: "",
                holderName: ""
            });
            setErrors({});
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="glass-card border-border/40 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Link Bank Account</DialogTitle>
                    <DialogDescription>Add your details to enable wallet features.</DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4 py-4 animate-fade-in">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Bank Name</Label>
                                <Input
                                    placeholder="e.g. HDFC Bank"
                                    className={`glass-input ${errors.bankName ? 'border-red-500' : ''}`}
                                    value={bankForm.bankName}
                                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                />
                                {errors.bankName && <p className="text-xs text-red-500">{errors.bankName}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Account Number</Label>
                                <Input
                                    placeholder="Enter account number"
                                    className={`glass-input ${errors.accountNumber ? 'border-red-500' : ''}`}
                                    value={bankForm.accountNumber}
                                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                                    maxLength={18}
                                />
                                {errors.accountNumber && <p className="text-xs text-red-500">{errors.accountNumber}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>IFSC Code</Label>
                                    <Input
                                        placeholder="HDFC000XXXX"
                                        className={`glass-input ${errors.ifscCode ? 'border-red-500' : ''}`}
                                        value={bankForm.ifscCode}
                                        onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                                        maxLength={11}
                                    />
                                    {errors.ifscCode && <p className="text-xs text-red-500">{errors.ifscCode}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Account Holder</Label>
                                    <Input
                                        placeholder="Exact name"
                                        className={`glass-input ${errors.holderName ? 'border-red-500' : ''}`}
                                        value={bankForm.holderName}
                                        onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                                    />
                                    {errors.holderName && <p className="text-xs text-red-500">{errors.holderName}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleLinkBank}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Verify & Link
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 2 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                        <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                        <div>
                            <h3 className="text-lg font-semibold">Verifying Details</h3>
                            <p className="text-sm text-muted-foreground">Doing a secure check with your bank...</p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-scale-in">
                        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-2">
                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-foreground">Bank Linked!</h3>
                            <p className="text-muted-foreground mt-1">
                                {bankForm.bankName} has been successfully verified and linked.
                            </p>
                        </div>
                        <Button className="w-full mt-6" size="lg" onClick={() => onOpenChange(false)}>
                            Go to Wallet
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
