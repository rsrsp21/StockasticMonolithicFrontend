/**
 * Market Skeleton Components - Loading states
 */

export const StockCardSkeleton = () => (
    <div className="w-full rounded-xl bg-muted/30 border border-border/30 p-4 animate-pulse overflow-hidden">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/50"></div>
            <div className="flex-1 min-w-0">
                <div className="h-4 w-20 max-w-full bg-muted/50 rounded mb-2"></div>
                <div className="h-3 w-full max-w-32 bg-muted/50 rounded"></div>
            </div>
            <div className="shrink-0 text-right">
                <div className="h-5 w-16 max-w-full bg-muted/50 rounded mb-2"></div>
                <div className="ml-auto h-4 w-12 max-w-full bg-muted/50 rounded"></div>
            </div>
        </div>
    </div>
);

export const CompactStockCardSkeleton = () => (
    <div className="w-full rounded-xl bg-muted/30 border border-border/30 p-4 animate-pulse overflow-hidden">
        <div className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/50"></div>
            <div className="w-full space-y-2">
                <div className="mx-auto h-4 w-16 max-w-full rounded bg-muted/50"></div>
                <div className="mx-auto h-3 w-full max-w-24 rounded bg-muted/50"></div>
            </div>
            <div className="w-full space-y-2">
                <div className="mx-auto h-5 w-20 max-w-full rounded bg-muted/50"></div>
                <div className="mx-auto h-4 w-12 max-w-full rounded bg-muted/50"></div>
            </div>
        </div>
    </div>
);

export const FeaturedSkeleton = () => (
    <div className="rounded-2xl bg-card border border-border/30 p-6 animate-pulse">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 mb-4"></div>
        <div className="h-5 w-20 bg-muted/50 rounded mb-2"></div>
        <div className="h-4 w-32 bg-muted/50 rounded mb-4"></div>
        <div className="h-8 w-24 bg-muted/50 rounded"></div>
    </div>
);
