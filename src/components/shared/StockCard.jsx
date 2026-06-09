import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../utils/utils";

/**
 * StockCard.jsx
 * 
 * A summary card component for a single stock, used in lists or grids.
 * Features:
 * - Interactive: Clickable with hover effects, used for navigation to stock details.
 * - Header: Shows Symbol (e.g. AAPL), Name, and a color-coded % change badge.
 * - Body: Displays current Price and absolute value change in monospace font.
 */
export function StockCard({ symbol, name, price, change, changePercent, onClick }) {
  const isPositive = change >= 0;
  return (<div onClick={onClick} className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:bg-card/80">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {symbol}
        </h3>
        <p className="text-sm text-muted-foreground truncate max-w-[120px]">{name}</p>
      </div>
      <div className={cn("flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {changePercent.toFixed(2)}%
      </div>
    </div>
    <div className="mt-3">
      <p className="text-lg font-bold text-foreground font-mono">${price.toFixed(2)}</p>
      <p className={cn("text-sm font-mono", isPositive ? "text-success" : "text-destructive")}>
        {isPositive ? "+" : ""}{change.toFixed(2)}
      </p>
    </div>
  </div>);
}
