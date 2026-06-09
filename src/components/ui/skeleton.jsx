import { cn } from "../../utils/utils";

/**
 * Skeleton - Base skeleton component with shimmer animation
 */
function Skeleton({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-muted",
    glass: "bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:200%_100%] animate-shimmer",
    pulse: "animate-pulse bg-muted/50",
  };

  return (
    <div
      className={cn(
        "rounded-lg",
        variant === "glass" ? variants.glass : variants[variant] || variants.default,
        variant !== "glass" && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

/**
 * SkeletonCard - Full card skeleton with glass effect
 */
function SkeletonCard({ className, ...props }) {
  return (
    <div
      className={cn(
        "glass-card p-6 space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="glass" className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="glass" className="h-4 w-3/4" />
          <Skeleton variant="glass" className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton variant="glass" className="h-3 w-full" />
        <Skeleton variant="glass" className="h-3 w-5/6" />
        <Skeleton variant="glass" className="h-3 w-4/6" />
      </div>
    </div>
  );
}

/**
 * SkeletonText - Text line skeleton
 */
function SkeletonText({ lines = 3, className, ...props }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="glass"
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/5" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Circular avatar skeleton
 */
function SkeletonAvatar({ size = "md", className, ...props }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
  };

  return (
    <Skeleton
      variant="glass"
      className={cn(
        "rounded-full",
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    />
  );
}

/**
 * SkeletonButton - Button skeleton
 */
function SkeletonButton({ size = "md", className, ...props }) {
  const sizes = {
    sm: "h-9 w-24",
    md: "h-10 w-32",
    lg: "h-11 w-40",
  };

  return (
    <Skeleton
      variant="glass"
      className={cn(
        "rounded-lg",
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    />
  );
}

/**
 * SkeletonChart - Chart placeholder skeleton
 */
function SkeletonChart({ className, ...props }) {
  return (
    <div
      className={cn("glass-card p-6 space-y-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="glass" className="h-5 w-32" />
        <Skeleton variant="glass" className="h-4 w-20" />
      </div>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 flex items-end"
          >
            <Skeleton
              variant="glass"
              className="w-full rounded-t-md"
              style={{
                height: `${Math.random() * 80 + 20}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonTable - Table rows skeleton
 */
function SkeletonTable({ rows = 5, columns = 4, className, ...props }) {
  return (
    <div className={cn("glass-card overflow-hidden", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant="glass"
            className="h-4 flex-1"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-border/30 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="glass"
              className="h-4 flex-1"
              style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonStock - Stock card skeleton
 */
function SkeletonStock({ className, ...props }) {
  return (
    <div
      className={cn("glass-card p-4 flex items-center gap-4", className)}
      {...props}
    >
      <Skeleton variant="glass" className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton variant="glass" className="h-4 w-20" />
          <Skeleton variant="glass" className="h-5 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton variant="glass" className="h-3 w-32" />
          <Skeleton variant="glass" className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * SkeletonDashboard - Full dashboard loading state
 */
function SkeletonDashboard({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-8 w-64" />
          <Skeleton variant="glass" className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <Skeleton variant="glass" className="h-4 w-24" />
              <Skeleton variant="glass" className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton variant="glass" className="h-8 w-32" />
            <Skeleton variant="glass" className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStock key={i} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonChart,
  SkeletonTable,
  SkeletonStock,
  SkeletonDashboard,
  SkeletonStockDetail,
  SkeletonMarket,
  SkeletonWatchlist,
  SkeletonGeneric,
  SkeletonWallet,
  SkeletonNotifications,
  SkeletonTablePage,
  SkeletonCompare,
};

/**
 * SkeletonCompare - Full compare page loading state
 */
function SkeletonCompare({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-8 w-64" />
          <Skeleton variant="glass" className="h-4 w-96" />
        </div>
        <SkeletonButton size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Labels column */}
        <div className="hidden lg:flex flex-col gap-4 mt-14">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="glass" className="h-12 border-r border-border/30 mx-4" />
          ))}
        </div>
        {/* Stock columns */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card h-[400px] border border-border/30 space-y-4 p-4">
            <div className="flex justify-between items-center pb-2 border-b border-border/30">
              <div className="space-y-1">
                <Skeleton variant="glass" className="h-6 w-16" />
                <Skeleton variant="glass" className="h-3 w-24" />
              </div>
              <Skeleton variant="glass" className="h-6 w-12 rounded-full" />
            </div>
            <div className="space-y-4 pt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex justify-between items-center py-1">
                  <Skeleton variant="glass" className="h-3 w-16" />
                  <Skeleton variant="glass" className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonTablePage - Header + Table loading state
 */
function SkeletonTablePage({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-8 w-48" />
          <Skeleton variant="glass" className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" />
        </div>
      </div>
      <SkeletonTable rows={10} columns={5} />
    </div>
  );
}

/**
 * SkeletonWallet - Full wallet page loading state
 */
function SkeletonWallet({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-8 w-40" />
          <Skeleton variant="glass" className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" />
        </div>
      </div>

      {/* Balance Card Skeleton */}
      <div className="glass-card p-8 h-64 flex flex-col justify-between">
        <div className="space-y-4">
          <Skeleton variant="glass" className="h-4 w-32" />
          <Skeleton variant="glass" className="h-10 w-64" />
        </div>
        <div className="flex gap-4">
          <Skeleton variant="glass" className="h-12 w-40 rounded-xl" />
          <Skeleton variant="glass" className="h-12 w-40 rounded-xl" />
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <Skeleton variant="glass" className="h-6 w-48" />
        <SkeletonTable rows={10} columns={5} />
      </div>
    </div>
  );
}

/**
 * SkeletonNotifications - Full notifications page loading state
 */
function SkeletonNotifications({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-8 w-48" />
          <Skeleton variant="glass" className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card p-4 border-l-4 border-border/30 flex gap-4">
            <Skeleton variant="glass" className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="glass" className="h-4 w-32" />
                <Skeleton variant="glass" className="h-3 w-20" />
              </div>
              <Skeleton variant="glass" className="h-4 w-full" />
              <Skeleton variant="glass" className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonMarket - Full market page loading state
 */
function SkeletonMarket({ className, ...props }) {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-8 w-64" />
          <Skeleton variant="glass" className="h-4 w-48" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton variant="glass" className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-40 space-y-4">
              <Skeleton variant="glass" className="h-16 w-16 rounded-2xl" />
              <Skeleton variant="glass" className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map(section => (
          <div key={section} className="space-y-4">
            <Skeleton variant="glass" className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass-card p-4 flex gap-4 items-center">
                  <Skeleton variant="glass" className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="glass" className="h-4 w-24" />
                    <Skeleton variant="glass" className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonWatchlist - Watchlist page loading state
 */
function SkeletonWatchlist({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <Skeleton variant="glass" className="h-8 w-64" />
        <SkeletonButton />
      </div>
      <div className="flex gap-4 border-b border-border/30 pb-2">
        <Skeleton variant="glass" className="h-8 w-24" />
        <Skeleton variant="glass" className="h-8 w-24" />
      </div>
      <SkeletonTable rows={8} />
    </div>
  );
}

/**
 * SkeletonGeneric - A neutral page skeleton fallback
 */
function SkeletonGeneric({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-8 w-64" />
          <Skeleton variant="glass" className="h-4 w-48" />
        </div>
        <SkeletonButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonStockDetail - Full stock detail page loading state
 */
function SkeletonStockDetail({ className, ...props }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex items-start gap-4">
          <Skeleton variant="glass" className="h-16 w-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton variant="glass" className="h-8 w-48" />
            <Skeleton variant="glass" className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" />
        </div>
      </div>

      {/* Price Section */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <Skeleton variant="glass" className="h-4 w-24" />
          <Skeleton variant="glass" className="h-10 w-48" />
          <Skeleton variant="glass" className="h-3 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="glass" className="h-3 w-16 ml-auto" />
              <Skeleton variant="glass" className="h-5 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <SkeletonChart className="h-[400px]" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-24 p-4" />
        ))}
      </div>

      {/* About */}
      <div className="glass-card p-6 space-y-3">
        <Skeleton variant="glass" className="h-6 w-32" />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}
