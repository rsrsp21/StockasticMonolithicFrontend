import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";

/**
 * Holdings Card component - displays a single stock holding with P&L.
 */
export function HoldingsCard({ holding, onBuy, onSell, onClick }) {
    const {
        symbol,
        stockName,
        image,
        sector,
        quantity,
        averagePrice,
        currentPrice,
        investedAmount,
        currentValue,
        profitLoss, // Unrealized
        totalPnl,   // Realized + Unrealized
        profitLossPercent
    } = holding;

    // Use Total P&L if available (for lifetime view), else Unrelized
    const displayPnl = totalPnl !== undefined ? totalPnl : profitLoss;
    const isPositive = displayPnl >= 0;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <div
            className="glass-card p-4 hover:bg-muted/20 transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Stock Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary/40 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                            {image ? (
                                <img
                                    src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${image}`}
                                    alt={symbol}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-sm font-bold">{symbol?.charAt(0)}</span>
                            )}
                        </div>
                        <h3 className="font-semibold truncate">{stockName}</h3>
                        <Badge variant="secondary" className="font-mono text-xs shrink-0">
                            {symbol}
                        </Badge>
                    </div>
                    {sector && (
                        <p className="text-xs text-muted-foreground mt-1">{sector}</p>
                    )}

                    {/* Holdings Details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">Qty</span>
                            <span className="ml-2 font-medium">{quantity}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Avg</span>
                            <span className="ml-2 font-medium">{formatCurrency(averagePrice)}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">LTP</span>
                            <span className="ml-2 font-medium">
                                {formatCurrency(currentPrice)}
                                {holding.dayChangePercent !== undefined && (
                                    <span className={`text-xs ml-1 ${holding.dayChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ({holding.dayChangePercent >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Value</span>
                            <span className="ml-2 font-medium">{formatCurrency(currentValue)}</span>
                        </div>
                    </div>
                </div>

                {/* P&L */}
                <div className="text-right shrink-0">
                    <div className={`flex items-center justify-end gap-1 text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{isPositive ? '+' : ''}{formatCurrency(displayPnl)}</span>
                    </div>
                    <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{profitLossPercent?.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Invested: {formatCurrency(investedAmount)}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border/40">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onBuy?.(holding);
                    }}
                >
                    Buy More
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSell?.(holding);
                    }}
                >
                    Sell
                </Button>
            </div>
        </div>
    );
}
