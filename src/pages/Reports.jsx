import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { usePortfolioData } from "../hooks/usePortfolioData";
import { ordersApi } from "../api/ordersApi";
import { walletApi } from "../api/walletApi";
import { generatePortfolioPDF, generateCapitalGainsPDF, generateAccountStatementPDF, generateTradeBookPDF } from "../utils/reportGenerators";
import { usePageTitle } from "../hooks/usePageTitle";
import { FileText, Download, TrendingUp, Wallet, History, BarChart3, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "../components/ui/skeleton";

export default function Reports() {
    usePageTitle("Reports Center");

    // Portfolio Data
    const {
        holdings,
        portfolioSummary,
        isLoading: isLoadingPortfolio
    } = usePortfolioData({ enableWebSocket: false });

    // Orders Data (for Capital Gains & Trade Book)
    const { data: allOrders, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['allOrders'],
        queryFn: ordersApi.getOrderHistory,
    });

    // Wallet Data (for Account Statement)
    // Fetching a large page size to get most transactions. 
    // Ideally, backend should support "getAll" or export endpoint, but for client-side PDF, we fetch list.
    const { data: walletData, isLoading: isLoadingWallet } = useQuery({
        queryKey: ['walletTransactions', 'all'],
        queryFn: () => walletApi.getTransactions(0, 1000), // Fetch last 1000 transactions
    });

    // States
    const [selectedFY, setSelectedFY] = useState("2024-2025");
    const [generating, setGenerating] = useState(null); // 'portfolio', 'gains', 'statement', 'tradebook'

    // Handlers
    const handleDownloadPortfolio = async () => {
        setGenerating('portfolio');
        try {
            if (!holdings || holdings.length === 0) {
                toast.error("No holdings available to generate report.");
                return;
            }
            // Use current portfolio data (already enriched with live prices if available via hook)
            await generatePortfolioPDF(portfolioSummary, holdings);
            toast.success("Portfolio Summary downloaded.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report.");
        } finally {
            setGenerating(null);
        }
    };

    const handleDownloadCapitalGains = async () => {
        setGenerating('gains');
        try {
            if (!allOrders || allOrders.length === 0) {
                toast.error("No order history available.");
                return;
            }
            await generateCapitalGainsPDF(allOrders, selectedFY);
            toast.success(`Capital Gains Report (${selectedFY}) downloaded.`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report.");
        } finally {
            setGenerating(null);
        }
    };

    const handleDownloadAccountStatement = async () => {
        setGenerating('statement');
        try {
            if (!walletData || !walletData.content || walletData.content.length === 0) {
                toast.error("No transactions found.");
                return;
            }
            await generateAccountStatementPDF(walletData.content);
            toast.success("Account Statement downloaded.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report.");
        } finally {
            setGenerating(null);
        }
    };

    const handleDownloadTradeBook = async () => {
        setGenerating('tradebook');
        try {
            if (!allOrders || allOrders.length === 0) {
                toast.error("No trades found.");
                return;
            }
            await generateTradeBookPDF(allOrders);
            toast.success("Trade Book downloaded.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report.");
        } finally {
            setGenerating(null);
        }
    };

    const isLoading = isLoadingPortfolio || isLoadingOrders || isLoadingWallet;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    Reports Center
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Download statements, tax reports, and portfolio summaries instantly.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Portfolio Summary */}
                <Card className="hover:border-primary/50 transition-colors flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Portfolio Summary
                        </CardTitle>
                        <CardDescription>
                            Detailed snapshot of your current investments, real-time value, and overall P&L.
                            Great for a quick overview.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground flex-1">
                        <div className="flex justify-between">
                            <span>Holdings:</span>
                            <span className="font-medium text-foreground">{holdings.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Invested:</span>
                            <span className="font-medium text-foreground">₹{portfolioSummary.totalInvested.toFixed(2)}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="mt-auto">
                        <Button
                            className="w-full gap-2"
                            onClick={handleDownloadPortfolio}
                            disabled={generating === 'portfolio'}
                        >
                            <Download className="h-4 w-4" />
                            {generating === 'portfolio' ? 'Generating...' : 'Download PDF'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* 2. Capital Gains */}
                <Card className="hover:border-primary/50 transition-colors flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Capital Gains (Tax Report)
                        </CardTitle>
                        <CardDescription>
                            Realized Profit & Loss statement for income tax filing. Includes STCG and LTCG breakdown.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Financial Year</label>
                            <Select value={selectedFY} onValueChange={setSelectedFY}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select FY" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2025-2026">FY 2025-26</SelectItem>
                                    <SelectItem value="2024-2025">FY 2024-25</SelectItem>
                                    <SelectItem value="2023-2024">FY 2023-24</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                Calculated using First-In-First-Out (FIFO) method based on your trade history.
                            </span>
                        </div>
                    </CardContent>
                    <CardFooter className="mt-auto">
                        <Button
                            className="w-full gap-2"
                            onClick={handleDownloadCapitalGains}
                            disabled={generating === 'gains'}
                        >
                            <Download className="h-4 w-4" />
                            {generating === 'gains' ? 'Generating...' : 'Download Report'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* 3. Account Statement */}
                <Card className="hover:border-primary/50 transition-colors flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-purple-500" />
                            Account Statement
                        </CardTitle>
                        <CardDescription>
                            Complete ledger of all deposits, withdrawals, and stock purchases/sales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground flex-1">
                        <div className="flex justify-between">
                            <span>Total Transactions:</span>
                            <span className="font-medium text-foreground">
                                {walletData?.totalElements || walletData?.content?.length || 0}
                            </span>
                        </div>
                        <p className="text-xs">
                            *Exports last 1000 transactions.
                        </p>
                    </CardContent>
                    <CardFooter className="mt-auto">
                        <Button
                            className="w-full gap-2"
                            onClick={handleDownloadAccountStatement}
                            disabled={generating === 'statement'}
                        >
                            <Download className="h-4 w-4" />
                            {generating === 'statement' ? 'Generating...' : 'Download Statement'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* 4. Trade Book */}
                <Card className="hover:border-primary/50 transition-colors flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-orange-500" />
                            Trade Book
                        </CardTitle>
                        <CardDescription>
                            Comprehensive list of every buy and sell order executed on the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground flex-1">
                        <div className="flex justify-between">
                            <span>Total Orders:</span>
                            <span className="font-medium text-foreground">{allOrders?.length || 0}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="mt-auto">
                        <Button
                            className="w-full gap-2"
                            onClick={handleDownloadTradeBook}
                            disabled={generating === 'tradebook'}
                        >
                            <Download className="h-4 w-4" />
                            {generating === 'tradebook' ? 'Generating...' : 'Download Trade Book'}
                        </Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
