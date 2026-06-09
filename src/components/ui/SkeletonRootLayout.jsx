import {
    SkeletonDashboard,
    SkeletonStockDetail,
    SkeletonTable,
    SkeletonMarket,
    SkeletonWatchlist,
    SkeletonGeneric,
    SkeletonWallet,
    SkeletonNotifications,
    SkeletonTablePage,
    SkeletonCompare,
    Skeleton
} from "./skeleton";

export function SkeletonRootLayout() {
    // Determine which skeleton to show based on the current URL path
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';

    const renderPageSkeleton = () => {
        if (path.startsWith('/stock/')) return <SkeletonStockDetail />;
        if (path.includes('/market')) return <SkeletonMarket />;
        if (path.includes('/explore')) return <SkeletonTablePage />;
        if (path.includes('/watchlist')) return <SkeletonWatchlist />;
        if (path.includes('/wallet')) return <SkeletonWallet />;
        if (path.includes('/notifications')) return <SkeletonNotifications />;
        if (path.includes('/auto-sell') || path.includes('/alerts')) return <SkeletonTablePage />;
        if (path.includes('/portfolio') || path === '/' || path.includes('/holdings')) return <SkeletonDashboard />;
        if (path.includes('/sip')) return <SkeletonGeneric />;
        if (path.includes('/compare')) return <SkeletonCompare />;
        if (path.includes('/profile')) return (
            <div className="space-y-8">
                <div className="space-y-2">
                    <Skeleton variant="glass" className="h-8 w-48" />
                    <Skeleton variant="glass" className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-6 glass-card p-6">
                    <Skeleton variant="glass" className="h-24 w-24 rounded-full" />
                    <div className="space-y-3 flex-1">
                        <Skeleton variant="glass" className="h-6 w-1/3" />
                        <Skeleton variant="glass" className="h-4 w-1/4" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-4 border-b border-border/30 pb-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton variant="glass" key={i} className="h-8 w-24" />
                        ))}
                    </div>
                    <Skeleton variant="glass" className="h-64 w-full" />
                </div>
            </div>
        );

        // Fallback for everything else
        return <SkeletonGeneric />;
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            {/* Sidebar Skeleton (Desktop) */}
            <div className="hidden lg:flex w-72 flex-col border-r border-border/30 h-full p-6 space-y-6 glass-panel">
                {/* Logo mimic */}
                <div className="flex items-center gap-3 px-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse" />
                    <div className="h-6 w-24 bg-muted/50 rounded-md animate-pulse" />
                </div>

                {/* Nav Items */}
                <div className="space-y-2 mt-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background effects to match app */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="gradient-orb gradient-orb-1" />
                    <div className="gradient-orb gradient-orb-2" />
                    <div className="noise-bg absolute inset-0 opacity-20" />
                </div>

                {/* Header Skeleton */}
                <div className="relative z-10 h-16 border-b border-border/30 flex items-center justify-between px-6 glass-panel">
                    <div className="h-4 w-32 bg-muted/50 rounded-md animate-pulse" />
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-muted/50 animate-pulse" />
                        <div className="h-9 w-9 rounded-full bg-muted/50 animate-pulse" />
                    </div>
                </div>

                {/* Page Content Skeleton */}
                <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {renderPageSkeleton()}
                    </div>
                </main>
            </div>
        </div>
    );
}
