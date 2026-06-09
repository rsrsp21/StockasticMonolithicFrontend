import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { History, ArrowDownLeft, ArrowUpRight, ArrowUp, ArrowDown } from "lucide-react";
import { Pagination } from "../common/Pagination";

export function TransactionHistory({
    transactions,
    currentPage,
    pageSize,
    onPageChange,
    isLoading
}) {
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState("");
    const [sortDir, setSortDir] = useState("asc");

    const filteredTransactions = transactions.filter(txn => {
        if (filterType === "all") return true;
        if (filterType === "deposits") return txn.type === "CREDIT";
        if (filterType === "withdrawals") return txn.type === "DEBIT";
        return true;
    });

    const sortedTransactions = useMemo(() => {
        if (!sortBy) return filteredTransactions;

        const rows = [...filteredTransactions];
        return rows.sort((a, b) => {
            let comparison = 0;
            if (sortBy === "createdAt") {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === "amount") {
                comparison = Number(a.amount || 0) - Number(b.amount || 0);
            } else {
                const aVal = String(a?.[sortBy] ?? "").toLowerCase();
                const bVal = String(b?.[sortBy] ?? "").toLowerCase();
                comparison = aVal.localeCompare(bVal);
            }
            return sortDir === "asc" ? comparison : -comparison;
        });
    }, [filteredTransactions, sortBy, sortDir]);

    const totalElements = sortedTransactions.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
    const safeCurrentPage = Math.min(currentPage, Math.max(totalPages - 1, 0));

    const paginatedTransactions = useMemo(() => {
        const startIndex = safeCurrentPage * pageSize;
        return sortedTransactions.slice(startIndex, startIndex + pageSize);
    }, [pageSize, safeCurrentPage, sortedTransactions]);

    useEffect(() => {
        if (currentPage !== safeCurrentPage) {
            onPageChange(safeCurrentPage);
        }
    }, [currentPage, onPageChange, safeCurrentPage]);

    useEffect(() => {
        if (currentPage !== 0) {
            onPageChange(0);
        }
    }, [filterType, onPageChange, sortBy, sortDir]);

    const handleSortChange = (columnKey) => {
        if (sortBy === columnKey) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setSortBy(columnKey);
        setSortDir("desc");
    };

    const renderSortHeader = (label, columnKey, align = "left") => {
        const isActive = sortBy === columnKey;
        const isAsc = sortDir === "asc";

        return (
            <button
                type="button"
                onClick={() => handleSortChange(columnKey)}
                className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${align === "right" ? "ml-auto" : ""}`}
                title={`Sort by ${label}`}
            >
                <span>{label}</span>
                {isActive ? (
                    isAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                    <ArrowUp className="h-3.5 w-3.5 opacity-30" />
                )}
            </button>
        );
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <Tabs defaultValue="all" className="w-full" onValueChange={setFilterType}>
            <div className="flex items-center justify-between mb-4 mt-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-muted-foreground" /> Transactions
                </h2>
                <TabsList className="glass-panel border-border/40">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="deposits">Deposits</TabsTrigger>
                    <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                </TabsList>
            </div>

            <Card className="glass-card border-border/30">
                <CardContent className="p-0 text-center">
                    {filteredTransactions.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
                            <p>No transactions yet</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/40">
                                        <TableHead>{renderSortHeader("Date", "createdAt")}</TableHead>
                                        <TableHead>{renderSortHeader("Type", "type")}</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">{renderSortHeader("Amount", "amount", "right")}</TableHead>
                                        <TableHead className="text-right">{renderSortHeader("Status", "status", "right")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedTransactions.map((txn) => (
                                        <TableRow key={txn.transactionId} className="border-border/30 hover:bg-muted/30 transition-colors group">
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">
                                                        {new Date(txn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${txn.type === 'CREDIT' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {txn.type === 'CREDIT' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                                    </div>
                                                    <span className="text-xs font-bold uppercase tracking-wider">{txn.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{txn.description}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{txn.referenceId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`text-sm font-bold ${txn.type === 'CREDIT' ? 'text-green-500' : 'text-foreground'}`}>
                                                    {txn.type === 'CREDIT' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 ${txn.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        txn.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                                        }`}
                                                >
                                                    {txn.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {/* Pagination Control */}
                            {totalElements > 0 && (
                                <Pagination
                                    currentPage={safeCurrentPage}
                                    totalPages={totalPages}
                                    totalElements={totalElements}
                                    pageSize={pageSize}
                                    onPageChange={onPageChange}
                                    isLoading={isLoading}
                                    itemLabel="transactions"
                                />
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </Tabs>
    );
}
