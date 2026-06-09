import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, CreditCard, History, Building2, Star, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { bankAccountApi } from "../../api/walletApi";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";

export function WalletBalanceCard({
    wallet,
    bankDetails,
    allBankAccounts = [],
    onAddMoney,
    onWithdraw,
    lastTransactionDescription,
    onBankAccountsChange
}) {
    const [showBankDetails, setShowBankDetails] = useState(false);
    const [settingPrimaryId, setSettingPrimaryId] = useState(null);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const handleSetPrimary = async (accountId) => {
        setSettingPrimaryId(accountId);
        try {
            await bankAccountApi.setPrimaryBankAccount(accountId);
            toast.success(MESSAGES.SUCCESS.WALLET.PRIMARY_UPDATED);
            if (onBankAccountsChange) {
                onBankAccountsChange();
            }
        } catch (error) {
            console.error("Failed to set primary:", error);
            toast.error(MESSAGES.WALLET.PRIMARY_UPDATE_FAILED);
        } finally {
            setSettingPrimaryId(null);
        }
    };

    // Calculate total balance from wallet object
    const totalBalance = (wallet?.availableBalance || 0) + (wallet?.lockedBalance || 0);

    // Find primary account
    const primaryAccount = allBankAccounts.find(acc => acc.isPrimary) || bankDetails;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Balance Card */}
            <Card className="md:col-span-2 border-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <WalletIcon className="h-5 w-5" /> Wallet Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-end gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-primary font-medium mb-1">Total Balance</p>
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                    {formatCurrency(totalBalance)}
                                </h2>
                            </div>
                            <div className="flex gap-6">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Available</p>
                                    <p className="text-xl font-bold text-green-500">{formatCurrency(wallet?.availableBalance)}</p>
                                </div>
                                <div className="w-px h-10 bg-muted/50" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Locked</p>
                                    <p className="text-xl font-bold text-amber-500">{formatCurrency(wallet?.lockedBalance)}</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Last Updated: {formatDate(wallet?.updatedAt)}
                            </p>
                        </div>

                        <div className="flex gap-3 w-full 2xl:w-auto">
                            <Button
                                size="lg"
                                className="flex-1 2xl:flex-none font-semibold shadow-lg shadow-primary/20"
                                onClick={onAddMoney}
                            >
                                <ArrowDownLeft className="mr-2 h-4 w-4" /> Add Money
                            </Button>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="flex-1 2xl:flex-none font-semibold"
                                onClick={onWithdraw}
                            >
                                <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bank Info Card */}
            <Card className="glass-card border-border/30 h-full">
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-4 2xl:gap-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Primary Bank</p>
                                    <p className="font-semibold">{primaryAccount?.bankName || "Not set"}</p>
                                </div>
                            </div>
                            <Dialog open={showBankDetails} onOpenChange={setShowBankDetails}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-full 2xl:w-auto h-8 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10">
                                        View All ({allBankAccounts.length})
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-card border-border/40 sm:max-w-[450px]">
                                    <DialogHeader>
                                        <DialogTitle>Linked Bank Accounts</DialogTitle>
                                        <DialogDescription>
                                            {allBankAccounts.length} account{allBankAccounts.length !== 1 ? 's' : ''} linked. Tap the star to set as primary.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-4 max-h-80 overflow-y-auto">
                                        {allBankAccounts.map((account) => (
                                            <div
                                                key={account.id}
                                                className={`p-4 rounded-xl border space-y-3 ${account.isPrimary
                                                    ? 'bg-primary/5 border-primary/30'
                                                    : 'bg-muted/30 border-border/40'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Building2 className="h-5 w-5 text-primary" />
                                                        <div>
                                                            <span className="font-semibold">{account.bankName}</span>
                                                            {account.isPrimary && (
                                                                <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                                                                    Primary
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!account.isPrimary && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleSetPrimary(account.id)}
                                                            disabled={settingPrimaryId === account.id}
                                                            className="h-8 w-8 p-0 hover:bg-primary/10"
                                                            title="Set as primary"
                                                        >
                                                            {settingPrimaryId === account.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Star className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    {account.isPrimary && (
                                                        <Star className="h-4 w-4 text-primary fill-primary" />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Account</p>
                                                        <p className="font-mono font-bold">{account.maskedAccountNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">IFSC</p>
                                                        <p className="font-mono font-bold">{account.ifscCode}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">
                                                        Verified
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Last TXN</p>
                                <p className="font-semibold">{lastTransactionDescription || "No transactions"}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
