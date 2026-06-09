import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../utils/utils";

export function HoldingRow({ holding, delay = 0 }) {
    const isPositive = holding.profitLoss >= 0;

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(val).replace('₹', '₹');

    return (
        <div
            className="flex items-center justify-between py-4 px-2 border-b border-border/30 last:border-0 hover:bg-muted/30 rounded-lg transition-colors animate-fade-in-up"
            style={{ animationDelay: `${delay}s` }}
        >
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center border border-primary/20">
                    <span className="text-xs font-bold text-primary">{holding.symbol?.slice(0, 2)}</span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{holding.symbol}</span>
                        {holding.isLive && (
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live Price" />
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">{holding.quantity} shares @ {formatCurrency(holding.averagePrice)}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="font-mono font-medium text-foreground">{formatCurrency(holding.currentValue)}</div>
                <div className={cn(
                    "flex items-center justify-end gap-1 text-xs font-medium",
                    isPositive ? "stock-up" : "stock-down"
                )}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? "+" : ""}{holding.profitLossPercent?.toFixed(2)}%
                </div>
            </div>
        </div>
    );
}
