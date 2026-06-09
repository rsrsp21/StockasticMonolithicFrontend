import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import {
    Building2,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    Package,
    Loader2,
} from "lucide-react";

/**
 * Unified Stock Table Component
 * @param {Object} props
 * @param {Array} props.stocks - Array of stock objects
 * @param {boolean} props.loading - Loading state
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onEdit - Edit handler (optional, hides edit button if not provided)
 * @param {Function} props.onDelete - Delete handler (optional, hides delete button if not provided)
 * @param {Function} props.onRowClick - Row click handler (optional)
 * @param {boolean} props.showStatus - Show status column (default: true for admin, false for user)
 * @param {boolean} props.showStockId - Show stock ID column
 */
export function StockTable({
    stocks,
    loading,
    searchQuery,
    onEdit,
    onDelete,
    onRowClick,
    showStatus = true,
    showMetrics = false,
    showStockId = false,
}) {
    // Determine colSpan based on visible columns
    let colSpan = 4; // Stock, Symbol, Exchange, Action
    if (showStockId) colSpan += 1; // Stock ID
    if (showMetrics) colSpan += 3; // Price, Change, Volume
    if (showStatus) colSpan += 1; // Status
    colSpan += 1; // Sector is always shown

    const isAdmin = Boolean(onEdit || onDelete);

    if (loading) {
        return Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
                <td className="p-4"><Skeleton className="h-10 w-48 rounded" /></td>
                {showStockId && <td className="p-4"><Skeleton className="h-4 w-10 rounded" /></td>}
                <td className="p-4"><Skeleton className="h-4 w-12 rounded" /></td>
                <td className="p-4"><Skeleton className="h-4 w-16 rounded" /></td>
                {showMetrics && (
                    <>
                        <td className="p-4"><Skeleton className="h-4 w-20 ml-auto rounded" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-16 ml-auto rounded" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24 ml-auto rounded" /></td>
                    </>
                )}
                <td className="p-4"><Skeleton className="h-4 w-24 rounded" /></td>
                {showStatus && <td className="p-4"><Skeleton className="h-6 w-20 rounded" /></td>}
                <td className="p-4"><Skeleton className="h-8 w-20 ml-auto rounded" /></td>
            </tr>
        ));
    }

    if (stocks.length === 0) {
        return (
            <tr>
                <td colSpan={colSpan} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                        <div>
                            <p className="font-medium text-foreground">No stocks found</p>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery
                                    ? "Try a different search term"
                                    : isAdmin
                                        ? "Add some stocks to get started"
                                        : "No stocks available at the moment"}
                            </p>
                        </div>
                    </div>
                </td>
            </tr>
        );
    }

    return stocks.map((stock) => (
        <tr
            key={stock.stockId}
            className={`hover:bg-secondary/30 transition-colors ${onRowClick ? "cursor-pointer" : ""
                }`}
            onClick={() => onRowClick?.(stock)}
        >
            {/* Stock Info */}
            <td className="p-4">
                <div className="flex items-center gap-3">
                    {stock.image ? (
                        <div className="w-10 h-10 rounded-md bg-card border border-border flex-shrink-0">
                            <img
                                src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${stock.image}`}
                                alt={stock.name}
                                className="w-full h-full object-contain rounded-md"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-foreground">{stock.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {stock.description || "No description"}
                        </p>
                    </div>
                </div>
            </td>

            {/* Stock ID */}
            {showStockId && (
                <td className="p-4">
                    <span className="font-mono text-sm text-muted-foreground">
                        {stock.stockId}
                    </span>
                </td>
            )}

            {/* Symbol */}
            <td className="p-4">
                <span className="font-mono text-sm font-semibold text-primary">
                    {stock.symbol}
                </span>
            </td>

            {/* Exchange */}
            <td className="p-4">
                <span className="text-sm text-foreground">{stock.exchange}</span>
            </td>

            {/* Metrics: Price, Change, Volume */}
            {showMetrics && (
                <>
                    <td className="p-4 text-right">
                        <div className="font-mono text-sm font-medium">
                            {stock.currentPrice ? stock.currentPrice.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR"
                            }) : "-"}
                        </div>
                    </td>
                    <td className="p-4 text-right">
                        {stock.changePercent !== undefined && stock.changePercent !== null ? (
                            <span className={`text-sm font-medium font-mono ${stock.changePercent >= 0 ? "text-positive-dark" : "text-negative-dark"}`}>
                                {stock.changePercent > 0 ? "+" : ""}
                                {stock.changePercent.toFixed(2)}%
                            </span>
                        ) : (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </td>
                    <td className="p-4 text-right">
                        <span className="text-sm text-foreground font-mono">
                            {stock.volume ? stock.volume.toLocaleString("en-IN") : "-"}
                        </span>
                    </td>
                </>
            )}

            {/* Sector */}
            <td className="p-4">
                <span className="text-sm text-muted-foreground">
                    {stock.sector || "-"}
                </span>
            </td>

            {/* Status - Only for admin */}
            {showStatus && (
                <td className="p-4">
                    {stock.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-positive-dark/10 text-positive-dark">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-negative-dark/10 text-negative-dark">
                            <XCircle className="h-3 w-3" />
                            Inactive
                        </span>
                    )}
                </td>
            )}

            {/* Actions */}
            <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                    {isAdmin ? (
                        <>
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(stock);
                                    }}
                                    className="gap-1.5"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive gap-1.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(stock);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                        </>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                            View
                        </span>
                    )}
                </div>
            </td>
        </tr>
    ));
}
