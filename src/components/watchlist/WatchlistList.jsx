import { FolderOpen, Loader2, Plus, Edit, Trash2, ChevronRight, Star } from "lucide-react";
import { Button } from "../ui/button";
import { Pagination } from "../common/Pagination";

export function WatchlistList({
    watchlists,
    loading,
    selectedWatchlist,
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    onSelectWatchlist,
    onEditClick,
    onDeleteClick,
    onPageChange,
    onCreateClick,
}) {
    return (
        <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-5">
                    <Star className="h-5 w-5 text-primary" />
                    Watchlists
                    <span className="text-sm font-normal text-muted-foreground">
                        ({totalElements})
                    </span>
                </h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                            <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                        </div>
                        <span className="text-muted-foreground mt-4 font-medium">Loading watchlists...</span>
                    </div>
                ) : watchlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 bg-secondary/50 rounded-2xl mb-4">
                            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <p className="font-semibold text-foreground text-lg">No watchlists yet</p>
                        <p className="text-sm text-muted-foreground mb-4 text-center">
                            Create your first watchlist to start tracking stocks
                        </p>
                        {onCreateClick && (
                            <Button
                                size="sm"
                                onClick={onCreateClick}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create Watchlist
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {watchlists.map((watchlist) => (
                            <div
                                key={watchlist.id}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${selectedWatchlist?.id === watchlist.id
                                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                                        : "bg-secondary/30 border-transparent hover:border-primary/30 hover:bg-secondary/50"
                                    }`}
                                onClick={() => onSelectWatchlist(watchlist)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${selectedWatchlist?.id === watchlist.id
                                                    ? "bg-primary/20"
                                                    : "bg-secondary"
                                                }`}>
                                                <FolderOpen className={`h-4 w-4 ${selectedWatchlist?.id === watchlist.id
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                    }`} />
                                            </div>
                                            <h3 className="font-semibold text-foreground truncate">
                                                {watchlist.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 ml-8 text-xs text-muted-foreground">
                                            <span className="font-medium bg-secondary/80 px-2 py-0.5 rounded-full">
                                                {watchlist.stockCount || 0} stocks
                                            </span>
                                            <span>
                                                {watchlist.createdAt && new Date(watchlist.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className={`h-5 w-5 flex-shrink-0 ml-2 transition-transform ${selectedWatchlist?.id === watchlist.id
                                            ? "text-primary rotate-90"
                                            : "text-muted-foreground"
                                        }`} />
                                </div>

                                {selectedWatchlist?.id === watchlist.id && (
                                    <div className="flex gap-2 mt-4 pt-3 border-t border-primary/20">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditClick(watchlist);
                                            }}
                                            className="gap-1.5 flex-1 hover:bg-primary/10"
                                        >
                                            <Edit className="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteClick(watchlist);
                                            }}
                                            className="gap-1.5 flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {totalElements > pageSize && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            pageSize={pageSize}
                            onPageChange={onPageChange}
                            isLoading={loading}
                            itemLabel="watchlists"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
