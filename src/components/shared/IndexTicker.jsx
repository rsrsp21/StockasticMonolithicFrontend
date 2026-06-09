import { useEffect, useState } from "react";
import { getPublicStocksPaged } from "../../services/stockService";
import { cn } from "../../utils/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const TICKER_POOL_SIZE = 20;
const TICKER_RANDOM_PICK = 12;
const TICKER_COMPACT_RANDOM_PICK = 10;

const mapTickerStocks = (stocks) =>
  stocks.map((stock) => ({
    name: stock.symbol,
    value: stock.currentPrice || 0,
    change: stock.change || 0,
    changePercent: stock.changePercent || 0,
  }));

const getRandomSubset = (items, count) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
};

const buildTickerLoopData = (items) => [...items, ...items, ...items, ...items];

/**
 * IndexTicker.jsx
 * 
 * A premium horizontally scrolling ticker banner for stock market indices (now stocks from backend).
 * Features glassmorphic design with smooth infinite animation.
 */
export function IndexTicker() {
  const [tickerData, setTickerData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPublicStocksPaged(0, TICKER_POOL_SIZE);
        const stocks = response.content || [];
        const mappedData = mapTickerStocks(stocks);
        const randomized = getRandomSubset(mappedData, TICKER_RANDOM_PICK);

        setTickerData(buildTickerLoopData(randomized));
      } catch (error) {
        console.error("Failed to fetch ticker data:", error);
      }
    };

    fetchData();
  }, []);

  if (tickerData.length === 0) return null; // Or return a loading skeleton

  return (
    <div className="relative overflow-hidden glass-card-subtle border border-border/30 rounded-xl">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background/90 to-transparent z-10 pointer-events-none" />

      {/* Ticker content */}
      <div className="flex animate-ticker gap-10 py-3 px-4">
        {tickerData.map((index, i) => (
          <div
            key={i}
            className="flex items-center gap-3 whitespace-nowrap group cursor-pointer"
          >
            {/* Index indicator dot - using changePercent for color logic */}
            <div className={cn(
              "h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-150",
              index.changePercent >= 0 ? "bg-success shadow-[0_0_8px_hsl(var(--success)/0.5)]" : "bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)]"
            )} />

            {/* Index name */}
            <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
              {index.name}
            </span>

            {/* Index value */}
            <span className="font-mono text-foreground/80 text-sm">
              {index.value.toLocaleString()}
            </span>

            {/* Change percentage with icon */}
            <span className={cn(
              "flex items-center gap-1 text-sm font-mono font-medium px-2 py-0.5 rounded-md transition-all duration-200",
              index.changePercent >= 0
                ? "text-success bg-success/10 group-hover:bg-success/20"
                : "text-destructive bg-destructive/10 group-hover:bg-destructive/20"
            )}>
              {index.changePercent >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * IndexTickerCompact - A more compact version for headers
 */
export function IndexTickerCompact() {
  const [tickerData, setTickerData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getPublicStocksPaged(0, TICKER_POOL_SIZE);
        const stocks = response.content || [];
        const mappedData = mapTickerStocks(stocks);
        const randomized = getRandomSubset(mappedData, TICKER_COMPACT_RANDOM_PICK);

        setTickerData(buildTickerLoopData(randomized));
      } catch (error) {
        console.error("Failed to fetch ticker data:", error);
      }
    };

    fetchData();
  }, []);

  if (tickerData.length === 0) return null;

  return (
    <div className="relative overflow-hidden border-b border-border/30 bg-background/50 backdrop-blur-sm">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="flex animate-ticker gap-8 py-2 px-4">
        {tickerData.map((index, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap text-xs">
            <span className="font-medium text-muted-foreground">{index.name}</span>
            <span className="font-mono text-foreground/70">{index.value.toLocaleString()}</span>
            <span className={cn(
              "flex items-center gap-0.5 font-mono font-medium",
              index.changePercent >= 0 ? "stock-up" : "stock-down"
            )}>
              {index.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
