import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X, Plus, Loader2, FolderOpen, Check } from "lucide-react";
import * as watchlistService from "../../services/watchlistService";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";

/**
 * Add to Watchlist Modal
 * Shows user's watchlists and allows adding/removing a stock from multiple watchlists
 */
export function AddToWatchlistModal({
    isOpen,
    stockId,
    stockName,
    stockSymbol,
    onClose,
    watchlists = [],
    isLoading = false,
    onAddStock, // Keeping for backward compatibility or direct add if needed
    userId,
}) {
    // Determine which watchlists the stock is already in
    const [selectedWatchlistIds, setSelectedWatchlistIds] = useState(new Set());
    const [loadingState, setLoadingState] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // id of watchlist being toggled
    const [newWatchlistName, setNewWatchlistName] = useState("");
    const [showCreateNew, setShowCreateNew] = useState(false);
    const [creatingWatchlist, setCreatingWatchlist] = useState(false);

    // Fetch existing presence when modal opens
    useEffect(() => {
        if (isOpen && stockId && userId) {
            setLoadingState(true);
            watchlistService.getWatchlistIdsContainingStock(stockId, userId)
                .then(ids => {
                    setSelectedWatchlistIds(new Set(ids));
                })
                .catch(err => console.error("Failed to fetch existing watchlists", err))
                .finally(() => setLoadingState(false));

            // Reset create state
            setNewWatchlistName("");
            setShowCreateNew(false);
        }
    }, [isOpen, stockId, userId]);

    if (!isOpen) return null;

    const handleToggleWatchlist = async (watchlistId) => {
        if (actionLoading) return; // Prevent multiple clicks

        const isSelected = selectedWatchlistIds.has(watchlistId);
        setActionLoading(watchlistId);

        try {
            if (isSelected) {
                // Remove
                await watchlistService.removeStockFromWatchlist(watchlistId, userId, stockId);
                const next = new Set(selectedWatchlistIds);
                next.delete(watchlistId);
                setSelectedWatchlistIds(next);
                toast.success(MESSAGES.SUCCESS.WATCHLIST.REMOVED_FROM);
            } else {
                // Add
                await watchlistService.addStockToWatchlist(watchlistId, userId, { stockId });
                const next = new Set(selectedWatchlistIds);
                next.add(watchlistId);
                setSelectedWatchlistIds(next);
                toast.success(MESSAGES.SUCCESS.WATCHLIST.ADDED_TO);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update watchlist");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateWatchlist = async () => {
        if (!newWatchlistName.trim()) return;

        setCreatingWatchlist(true);
        try {
            // 1. Create Watchlist
            const newWatchlist = await watchlistService.createWatchlist(userId, { name: newWatchlistName.trim() });

            // 2. Add current stock to it
            await watchlistService.addStockToWatchlist(newWatchlist.id, userId, { stockId });

            // 3. Update local state - tricky part is updates to parent's watchlist list might be needed
            // Ideally we should callback to parent to refresh list, but for now let's just show success
            // In a real app we'd likely use React Query invalidation or a context refresh

            toast.success(`Created "${newWatchlist.name}" and added stock`);
            onClose(); // Close modal on create success as per common pattern? Or refresh list?
            // Since we can't easily refresh the passed 'watchlists' prop without parent callback, closing is safest
            // Or we could just add to selected set if we could append to watchlists...
            // Let's rely on parent refresh or closing for now.

        } catch (err) {
            console.error(err);
            toast.error(MESSAGES.ERROR.WATCHLIST.CREATE_FAILED);
        } finally {
            setCreatingWatchlist(false);
            setNewWatchlistName("");
            setShowCreateNew(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6 animate-scale-in flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-foreground">Save to Watchlist</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Stock Info */}
                <div className="mb-4 p-3 bg-secondary/20 rounded-lg border border-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{stockSymbol}</span>
                        <span className="text-sm text-foreground opacity-80">{stockName}</span>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading || loadingState ? (
                    <div className="flex flex-col items-center justify-center py-12 flex-1">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                        <p className="text-sm text-muted-foreground">Loading your watchlists...</p>
                    </div>
                ) : watchlists.length === 0 && !showCreateNew ? (
                    <div className="text-center py-8 flex-1">
                        <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">No watchlists yet</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateNew(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create New Watchlist
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        {/* Watchlists List */}
                        {!showCreateNew && (
                            <>
                                <div className="space-y-2 overflow-y-auto pr-2 pb-2 -mr-2">
                                    {watchlists.map((watchlist) => {
                                        const isSelected = selectedWatchlistIds.has(watchlist.id);
                                        const isToggling = actionLoading === watchlist.id;

                                        return (
                                            <div
                                                key={watchlist.id}
                                                onClick={() => !isToggling && handleToggleWatchlist(watchlist.id)}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                                                    ? "bg-primary/10 border-primary/30"
                                                    : "bg-background border-border hover:bg-secondary/20"
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                                                    ? "bg-primary border-primary"
                                                    : "border-muted-foreground/50 bg-background"
                                                    }`}>
                                                    {isToggling ? (
                                                        <Loader2 className="h-3 w-3 animate-spin text-foreground" />
                                                    ) : isSelected && (
                                                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground text-sm truncate">
                                                        {watchlist.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {watchlist.stockCount || 0} stocks
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-3 mt-3 border-t border-border flex-shrink-0">
                                    <button
                                        onClick={() => setShowCreateNew(true)}
                                        className="w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2 flex items-center justify-center gap-2 rounded-lg hover:bg-primary/5"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Create New Watchlist
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Create New Watchlist */}
                        {showCreateNew && (
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Watchlist Name
                                    </label>
                                    <Input
                                        placeholder="e.g. High Growth, Dividend..."
                                        value={newWatchlistName}
                                        onChange={(e) => setNewWatchlistName(e.target.value)}
                                        className="glass-input"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleCreateWatchlist();
                                        }}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowCreateNew(false);
                                            setNewWatchlistName("");
                                        }}
                                        className="flex-1"
                                        disabled={creatingWatchlist}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateWatchlist}
                                        className="flex-1 gap-2 shadow-lg shadow-primary/20"
                                        disabled={!newWatchlistName.trim() || creatingWatchlist}
                                    >
                                        {creatingWatchlist ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4" />
                                                Create & Add
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Actions (Done button only, as actions are immediate) */}
                {!showCreateNew && !isLoading && watchlists.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border flex-shrink-0">
                        <Button
                            onClick={onClose}
                            className="w-full"
                        >
                            Done
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
