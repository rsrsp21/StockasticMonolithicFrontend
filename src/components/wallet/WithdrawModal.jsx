import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp";
import { CreditCard, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";
import { walletApi } from "../../api/walletApi";

export function WithdrawModal({ isOpen, onOpenChange, maxWithdrawAmount, bankAccounts = [], onSuccess }) {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState("");
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(60);
    const [isLoading, setIsLoading] = useState(false);

    // Reset all state when modal opens
    useEffect(() => {
        if (isOpen) {
            // Reset to initial state
            setStep(1);
            setAmount("");
            setOtp("");
            setIsLoading(false);

            // Set default selected account
            if (bankAccounts.length > 0) {
                setSelectedAccountId(bankAccounts[0].id);
            } else {
                setSelectedAccountId(null);
            }
        }
    }, [isOpen, bankAccounts]);

    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const handleOpenChange = (open) => {
        onOpenChange(open);
        if (!open) {
            setStep(1);
            setAmount("");
            setSelectedAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : null);
            setOtp("");
            setIsLoading(false);
        }
    };

    const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);

    const handleWithdrawSubmit = async () => {
        if (Number(amount) > maxWithdrawAmount) {
            toast.error(MESSAGES.ERROR.WALLET.INSUFFICIENT_FUNDS);
            return;
        }
        if (!amount || Number(amount) <= 0) {
            toast.error(MESSAGES.ERROR.WALLET.INVALID_AMOUNT);
            return;
        }
        if (!selectedAccountId) {
            toast.error(MESSAGES.VALIDATION.SELECT_BANK);
            return;
        }

        setIsLoading(true);
        try {
            // Send OTP for withdrawal
            await walletApi.sendOtp("WITHDRAW", parseFloat(amount));
            setTimer(60);
            setStep(2);
            toast.info(MESSAGES.SUCCESS.WALLET.OTP_SENT);
        } catch (error) {
            console.error("Failed to send OTP:", error);
            toast.error(error.response?.data?.message || MESSAGES.ERROR.GENERIC);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        setIsLoading(true);
        try {
            await walletApi.sendOtp("WITHDRAW", parseFloat(amount));
            setTimer(60);
            toast.info(MESSAGES.SUCCESS.WALLET.OTP_RESENT);
        } catch (error) {
            toast.error(error.response?.data?.message || MESSAGES.ERROR.GENERIC);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async () => {
        if (!selectedAccountId) {
            toast.error(MESSAGES.VALIDATION.NO_BANK);
            return;
        }

        setIsLoading(true);
        try {
            setStep(3);
            // Call withdraw API with selected account
            await walletApi.withdrawFunds(amount, otp, selectedAccountId);
            setStep(4);
            // Notify parent of success after a short delay
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (error) {
            setStep(2);
            console.error("Failed to withdraw:", error);
            toast.error(error.response?.data?.message || MESSAGES.ERROR.GENERIC);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    // Extract last 4 digits from masked account number
    const getLast4Digits = (account) => {
        if (account?.maskedAccountNumber) {
            const parts = account.maskedAccountNumber.split('-');
            return parts[parts.length - 1];
        }
        return '****';
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="glass-card border-border/40 sm:max-w-[480px]"
                hideCloseButton={step >= 2}
                onInteractOutside={(e) => {
                    // Prevent closing during OTP, processing, or success steps
                    if (step >= 2) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    // Prevent closing with Escape key during critical steps
                    if (step >= 2) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>Transfer money to your bank account.</DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4 py-4">
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1">Withdrawable</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(maxWithdrawAmount)}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <Input
                                placeholder="Enter amount"
                                className="glass-input text-lg"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                type="number"
                                min="1"
                                max={maxWithdrawAmount}
                            />
                        </div>

                        {/* Bank Account Selection */}
                        <div className="space-y-2">
                            <Label>Select Bank Account</Label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {bankAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        onClick={() => setSelectedAccountId(account.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedAccountId === account.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border/40 bg-muted/30 hover:bg-muted/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="h-4 w-4 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{account.bankName}</p>
                                                <p className="text-xs text-muted-foreground">•••• {getLast4Digits(account)}</p>
                                            </div>
                                        </div>
                                        {selectedAccountId === account.id && (
                                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleWithdrawSubmit}
                            disabled={!amount || !selectedAccountId || isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Review Withdrawal
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 py-4 text-center">
                        <div className="space-y-1">
                            <Label className="text-lg">Authorize Withdrawal</Label>
                            <p className="text-sm text-muted-foreground">
                                Withdrawing {formatCurrency(amount)} to {selectedAccount?.bankName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Enter OTP sent to your registered mobile.
                            </p>
                        </div>
                        <div className="flex flex-col items-center">
                            <InputOTP maxLength={4} value={otp} onChange={setOtp} className="gap-3">
                                <InputOTPGroup className="gap-3">
                                    {[0, 1, 2, 3].map((i) => (
                                        <InputOTPSlot key={i} index={i} className="w-14 h-16 text-2xl font-bold border-border/40 glass-card rounded-xl" />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                            <div className="mt-6 flex items-center gap-2">
                                {timer > 0 ? (
                                    <div className="bg-muted/30 py-2 px-4 rounded-full border border-border/30 text-sm">
                                        Resend in: <span className="font-mono font-bold text-primary">00:{timer < 10 ? `0${timer}` : timer}</span>
                                    </div>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={handleResendOtp} disabled={isLoading}>
                                        Resend OTP
                                    </Button>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="mt-6 flex flex-col gap-2">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleOtpSubmit}
                                disabled={otp.length !== 4 || isLoading}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirm & Withdraw
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 3 && (
                    <div className="py-12 flex flex-col items-center space-y-4 text-center">
                        <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                        <p>Processing Transfer...</p>
                    </div>
                )}

                {step === 4 && (
                    <div className="py-8 flex flex-col items-center space-y-4 text-center">
                        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold">Transfer Initiated!</h3>
                        <p className="text-muted-foreground">{formatCurrency(amount)} will reach {selectedAccount?.bankName} shortly.</p>
                        <Button className="w-full" onClick={() => onOpenChange(false)}>Finish</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
