import { X, Plus, Edit, Trash2, Search, Package, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function WatchlistModals({
    // Create Modal
    showCreateModal,
    onCreateClose,
    formData,
    onFormChange,
    onCreateSubmit,
    // Edit Modal
    showEditModal,
    onEditClose,
    onEditSubmit,
    // Delete Modal
    showDeleteModal,
    deletingWatchlist,
    onDeleteClose,
    onDeleteConfirm,
    // Add Stock Modal
    showAddStockModal,
    onAddStockClose,
    stockSearchQuery,
    onStockSearchChange,
    onStockSearch,  // NEW: trigger search
    availableStocks,
    onAddStock,
    stocksLoading = false,
}) {
    // Handle Enter key in search
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            onStockSearch?.();
        }
    };

    return (
        <>
            {/* Create Watchlist Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-md w-full p-6 animate-scale-in shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Create New Watchlist</h2>
                        </div>
                        <form onSubmit={onCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Tech Stocks, Blue Chips"
                                    className="glass-input"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCreateClose}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 gap-2 shadow-lg shadow-primary/25">
                                    <Plus className="h-4 w-4" />
                                    Create
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Watchlist Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-md w-full p-6 animate-scale-in shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Edit className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Edit Watchlist</h2>
                        </div>
                        <form onSubmit={onEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Name <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Tech Stocks"
                                    className="glass-input"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onEditClose}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 gap-2">
                                    <Edit className="h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-md w-full p-6 animate-scale-in shadow-2xl">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="h-7 w-7 text-destructive" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Delete Watchlist</h2>
                                <p className="text-muted-foreground mt-2">
                                    Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingWatchlist?.name}"</span>?
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onDeleteClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onDeleteConfirm}
                                className="flex-1 gap-2 bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/25"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Stock Modal */}
            {showAddStockModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-md w-full p-6 animate-scale-in max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Add Stock</h2>
                            </div>
                            <button
                                onClick={onAddStockClose}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search with button - only searches on Enter or button click */}
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-foreground/55" />
                                <Input
                                    value={stockSearchQuery}
                                    onChange={(e) => onStockSearchChange(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search by symbol or name..."
                                    className="pl-10 glass-input"
                                    autoFocus
                                />
                            </div>
                            <Button
                                onClick={onStockSearch}
                                disabled={stocksLoading || !stockSearchQuery.trim()}
                                className="gap-2"
                            >
                                {stocksLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                Search
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto -mx-2 px-2">
                            {stocksLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="text-muted-foreground mt-3">Searching...</span>
                                </div>
                            ) : availableStocks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="p-4 bg-secondary/50 rounded-2xl mb-3">
                                        <Package className="h-10 w-10 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-foreground font-medium">
                                        {stockSearchQuery ? "No stocks found" : "Search for stocks"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1 text-center">
                                        {stockSearchQuery
                                            ? "Try a different search term"
                                            : "Enter a name or symbol and press Search"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {availableStocks.map((stock) => (
                                        <div
                                            key={stock.stockId}
                                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                                        >
                                            <div>
                                                <p className="font-semibold text-foreground">{stock.name}</p>
                                                <span className="font-mono text-xs font-bold text-primary">
                                                    {stock.symbol}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => onAddStock(stock.stockId)}
                                                className="gap-1.5"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
