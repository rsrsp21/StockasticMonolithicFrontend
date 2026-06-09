import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { CreditCard, Loader2, Plus, Wallet as WalletIcon, TrendingUp } from "lucide-react";
import { RefreshButton } from "../components/common/RefreshButton";
import { WalletBalanceCard } from "../components/wallet/WalletBalanceCard";
import { TransactionHistory } from "../components/wallet/TransactionHistory";
import { BankLinkModal } from "../components/wallet/BankLinkModal";
import { AddMoneyModal } from "../components/wallet/AddMoneyModal";
import { WithdrawModal } from "../components/wallet/WithdrawModal";
import { walletApi, bankAccountApi } from "../api/walletApi";
import { toast } from "sonner";
import { MESSAGES } from "../utils/constants/messages";
import { usePageTitle } from "../hooks/usePageTitle";

const FETCH_SIZE = 1000;
const DISPLAY_PAGE_SIZE = 10;

export default function Wallet() {
    usePageTitle("Wallet");
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Modal states
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isLinkBankOpen, setIsLinkBankOpen] = useState(false);
    const [transactionPage, setTransactionPage] = useState(0);

    // 1. Fetch Wallet Balance
    const {
        data: wallet,
        isLoading: isWalletLoading,
        refetch: refetchWallet
    } = useQuery({
        queryKey: ['wallet'],
        queryFn: walletApi.getWallet,
    });

    // 2. Fetch Bank Accounts
    const {
        data: bankAccounts = [],
        isLoading: isBankLoading,
        refetch: refetchBanks
    } = useQuery({
        queryKey: ['bankAccounts'],
        queryFn: bankAccountApi.getBankAccounts,
    });

    const primaryBankAccount = bankAccounts.find(acc => acc.isPrimary) || (bankAccounts.length > 0 ? bankAccounts[0] : null);

    // 3. Fetch Transactions
    const {
        data: transactionsData,
        isLoading: isTransactionsLoading,
        refetch: refetchTransactions
    } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => walletApi.getTransactions(0, FETCH_SIZE),
    });

    const transactions = transactionsData?.content || [];

    // Handlers
    const handleRefresh = async () => {
        await Promise.all([
            refetchWallet(),
            refetchBanks(),
            refetchTransactions()
        ]);
    };

    const handlePageChange = useCallback((newPage) => {
        setTransactionPage(newPage);
    }, []);

    // Handle successful bank link
    const handleLinkSuccess = async () => {
        setIsLinkBankOpen(false);
        await refetchBanks();
        toast.success(MESSAGES.SUCCESS.WALLET.BANK_LINKED);
    };

    // Handle successful add money
    const handleAddMoneySuccess = async () => {
        setIsAddMoneyOpen(false);
        await Promise.all([refetchWallet(), refetchTransactions()]);
        toast.success(MESSAGES.SUCCESS.WALLET.ADDED);
    };

    // Handle successful withdrawal
    const handleWithdrawSuccess = async () => {
        setIsWithdrawOpen(false);
        await Promise.all([refetchWallet(), refetchTransactions()]);
        toast.success(MESSAGES.SUCCESS.WALLET.WITHDRAW_INITIATED);
    };

    const hasBankAccounts = bankAccounts.length > 0;

    // Loading State
    if (isWalletLoading || isBankLoading) {
        return (
            <>
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <WalletIcon className="h-7 w-7 text-primary" />
                            My Wallet
                        </h1>
                        <p className="text-muted-foreground">Manage your funds and transactions</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => navigate('/explore')} variant="outline" size="sm" className="gap-2">
                            <TrendingUp className="h-4 w-4" /> Explore Stocks
                        </Button>
                        {hasBankAccounts && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsLinkBankOpen(true)}
                                className="border-primary/30 hover:bg-primary/10"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Bank Account
                            </Button>
                        )}
                        <RefreshButton
                            onClick={handleRefresh}
                            isLoading={isWalletLoading || isBankLoading || isTransactionsLoading}
                            size="sm"
                        />
                    </div>
                </div>

                {!hasBankAccounts ? (
                    <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
                        <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
                            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                                <CreditCard className="h-12 w-12" />
                            </div>
                            <div className="max-w-md space-y-2">
                                <h2 className="text-3xl font-bold text-white">Link Your Bank Account</h2>
                                <p className="text-muted-foreground">
                                    To start trading and managing funds, you first need to link a verified bank account to your Stockastic wallet.
                                </p>
                            </div>
                            <Button
                                size="lg"
                                className="px-12 font-bold text-lg shadow-xl shadow-primary/20"
                                onClick={() => setIsLinkBankOpen(true)}
                            >
                                Link Account Now
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Main Balance & Action Cards */}
                        <WalletBalanceCard
                            wallet={wallet}
                            bankDetails={primaryBankAccount}
                            allBankAccounts={bankAccounts}
                            onAddMoney={() => setIsAddMoneyOpen(true)}
                            onWithdraw={() => setIsWithdrawOpen(true)}
                            lastTransactionDescription={transactions[0]?.description}
                            onBankAccountsChange={() => refetchBanks()}
                        />

                        {/* Transactions Section */}
                        <TransactionHistory
                            transactions={transactions}
                            currentPage={transactionPage}
                            pageSize={DISPLAY_PAGE_SIZE}
                            onPageChange={handlePageChange}
                            isLoading={isTransactionsLoading}
                        />
                    </>
                )}

                {/* Modals */}
                <BankLinkModal
                    isOpen={isLinkBankOpen}
                    onOpenChange={setIsLinkBankOpen}
                    onLinkSuccess={handleLinkSuccess}
                />

                <AddMoneyModal
                    isOpen={isAddMoneyOpen}
                    onOpenChange={setIsAddMoneyOpen}
                    onSuccess={handleAddMoneySuccess}
                    bankAccounts={bankAccounts}
                />

                <WithdrawModal
                    isOpen={isWithdrawOpen}
                    onOpenChange={setIsWithdrawOpen}
                    maxWithdrawAmount={wallet?.availableBalance || 0}
                    bankAccounts={bankAccounts}
                    onSuccess={handleWithdrawSuccess}
                />
            </div>
        </>
    );
}
