/**
 * Stock Card - Used for Top Gainers and Losers
 */
import { TrendingUp, TrendingDown, Clock, ChevronRight } from "lucide-react";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";

export const StockCard = ({ stock, type, onClick }) => {
    const isGainer = type === 'gainer';
    const isLoser = type === 'loser';
    const changePercent = stock.changePercent || 0;

    const getPriceColor = () => {
        if (isGainer) return 'text-success';
        if (isLoser) return 'text-destructive';
        return changePercent >= 0 ? 'text-success' : 'text-destructive';
    };

    const getBgGradient = () => {
        if (isGainer) return 'from-success/10 to-success/0';
        if (isLoser) return 'from-destructive/10 to-destructive/0';
        return 'from-primary/5 to-primary/0';
    };

    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-xl 
                bg-gradient-to-br ${getBgGradient()}
                backdrop-blur-sm border border-border/40
                p-4 cursor-pointer group
                hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
                transition-all duration-300 ease-out
                hover:-translate-y-1
            `}
        >
            <div className="flex items-center gap-4">
                {/* Stock Logo */}
                <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-muted/70 to-muted/30 border border-border/40 flex items-center justify-center overflow-hidden shrink-0">
                    {stock.image ? (
                        <img
                            src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${stock.image}`}
                            alt={stock.symbol}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-lg font-bold bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent">
                            {stock.symbol?.charAt(0)}
                        </span>
                    )}
                </div>

                {/* Stock Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {stock.symbol}
                        </p>
                        {isGainer && <TrendingUp className="h-3.5 w-3.5 text-success" />}
                        {isLoser && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                        {stock.stockName || stock.name}
                    </p>
                </div>

                {/* Price Info */}
                <div className="text-right shrink-0">
                    <p className="font-bold text-lg">
                        ₹{(stock.price || stock.currentPrice)?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm font-semibold ${getPriceColor()}`}>
                        {changePercent >= 0 ? '+' : ''}{changePercent?.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
};
