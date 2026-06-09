/**
 * Featured Stock Card - Large card for Most Traded section
 */
import { ChevronRight, Flame } from 'lucide-react';
import { API_ENDPOINTS } from "../../utils/constants/endpoints";

export const FeaturedStockCard = ({ stock, onClick }) => {
    const changePercent = stock.changePercent || 0;
    const isPositive = changePercent >= 0;

    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-br from-card to-surface-elevated
                border border-border/30
                p-6 cursor-pointer group
                hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10
                transition-all duration-300 ease-out
    `}
        >
            {/* Flame Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-warning/20 to-warning/10 border border-warning/25">
                <Flame className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">Hot</span>
            </div>

            <div className="relative z-10">
                {/* Stock Logo */}
                <div className="h-16 w-16 mb-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/40 flex items-center justify-center overflow-hidden">
                    {stock.image ? (
                        <img
                            src={`${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${stock.image}`}
                            alt={stock.symbol}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent">
                            {stock.symbol?.charAt(0)}
                        </span>
                    )}
                </div >

                {/* Stock Info */}
                < h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors" >
                    {stock.symbol}
                </h3 >
                <p className="text-sm text-muted-foreground mb-4 truncate">
                    {stock.stockName || stock.name}
                </p>

                {/* Price */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-2xl font-bold">
                            ₹{(stock.price || stock.currentPrice)?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                            {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div >
        </div >
    );
};
