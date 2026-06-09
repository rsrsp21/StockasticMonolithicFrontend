/**
 * Compact Stock Card - Vertical layout for Recently Visited
 */
import { API_ENDPOINTS } from "../../utils/constants/endpoints";

export const CompactStockCard = ({ stock, onClick }) => {
    const changePercent = stock.changePercent || 0;
    const isPositive = changePercent >= 0;

    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-xl 
                bg-gradient-to-br from-primary/10 to-primary/0
                backdrop-blur-sm border border-border/40
                p-4 cursor-pointer group
                hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
                transition-all duration-300 ease-out
                hover:-translate-y-1
            `}
        >
            <div className="flex flex-col items-center text-center gap-3">
                {/* Stock Logo */}
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-muted/70 to-muted/30 border border-border/40 flex items-center justify-center overflow-hidden">
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
                <div className="w-full">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {stock.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        {stock.stockName || stock.name}
                    </p>
                </div>

                {/* Price Info */}
                <div className="w-full">
                    <p className="font-bold">
                        ₹{(stock.price || stock.currentPrice)?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
};
