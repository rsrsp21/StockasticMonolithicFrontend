import { useState, useCallback, useEffect } from "react"; // kept useEffect for potential side effects if needed, though mostly replaced
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as watchlistService from "../services/watchlistService";
import { WatchlistDetails } from "../components/watchlist/WatchlistDetails";
import { WatchlistModals } from "../components/watchlist/WatchlistModals";
import { cn } from "../utils/utils";
import { Plus, FolderOpen, Star, TrendingUp, RefreshCw } from "lucide-react";
import { MESSAGES } from "../utils/constants/messages";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "../components/ui/button";
import { useSelector } from "react-redux";

const PAGE_SIZE = 10;
const WATCHLISTS_PAGE_SIZE = 50;

export default function Watchlists() {
    usePageTitle("Watchlists");
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const userId = user?.userId;
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    // URL State
    const activeWatchlistId = searchParams.get("activeWatchlist");
    const stocksPage = parseInt(searchParams.get("watchlistPage") || "0", 10);

    // 1. Fetch Watchlists
    const {
        data: watchlistsData,
        isLoading: watchlistsLoading,
        isFetching: isFetchingWatchlists
    } = useQuery({
        queryKey: ['watchlists', userId],
        queryFn: () => watchlistService.getUserWatchlistsPaged(userId, 0, WATCHLISTS_PAGE_SIZE),
        keepPreviousData: true,
    });

    const watchlists = watchlistsData?.content || [];

    // Determine Selected Watchlist
    // If ID is in URL, try to find it. If not found or no ID, default to first.
    const selectedWatchlist = activeWatchlistId
        ? watchlists.find(w => w.id.toString() === activeWatchlistId)
        : (watchlists.length > 0 ? watchlists[0] : null);

    // Effect: If no ID in URL but we have watchlists, set the first one as active in URL
    useEffect(() => {
        if (!activeWatchlistId && watchlists.length > 0) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set("activeWatchlist", watchlists[0].id.toString());
                return newParams;
            });
        }
    }, [activeWatchlistId, watchlists, setSearchParams]);

    // 2. Fetch Stocks for Selected Watchlist
    const {
        data: stocksData,
        isLoading: stocksLoading,
        isFetching: isFetchingStocks
    } = useQuery({
        queryKey: ['watchlistStocks', selectedWatchlist?.id, stocksPage],
        queryFn: () => watchlistService.getWatchlistItemsWithPricesPaged(
            selectedWatchlist.id,
            userId,
            stocksPage,
            PAGE_SIZE
        ),
        enabled: !!selectedWatchlist?.id, // Only run if we have a valid watchlist selected
        keepPreviousData: true,
    });

    const watchlistStocks = stocksData?.content || [];
    const stocksTotalPages = stocksData?.totalPages || 0;
    const stocksTotalElements = stocksData?.totalElements || 0;

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [editingWatchlist, setEditingWatchlist] = useState(null);
    const [deletingWatchlist, setDeletingWatchlist] = useState(null);

    // Form states
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [stockSearchQuery, setStockSearchQuery] = useState("");
    const [availableStocks, setAvailableStocks] = useState([]);
    const [stockSearchLoading, setStockSearchLoading] = useState(false);

    // Handlers
    const handleSelectWatchlist = (watchlist) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("activeWatchlist", watchlist.id.toString());
            newParams.set("watchlistPage", "0"); // Reset page on switch
            return newParams;
        });
    };

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set("watchlistPage", newPage.toString());
            return newParams;
        });
    };

    // Search stocks logic (kept manual for now as it's interaction-driven)
    const searchStocks = useCallback(async () => {
        if (!stockSearchQuery.trim()) {
            setAvailableStocks([]);
            return;
        }
        setStockSearchLoading(true);
        try {
            const data = await watchlistService.searchStocksToAdd(0, 20, "symbol", "asc", stockSearchQuery);
            setAvailableStocks(data.content || []);
        } catch (err) {
            console.error(err);
            toast.error(MESSAGES.ERROR.WATCHLIST.SEARCH_FAILED);
            setAvailableStocks([]);
        } finally {
            setStockSearchLoading(false);
        }
    }, [stockSearchQuery]);

    // CRUD Handlers
    const handleCreateWatchlist = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error(MESSAGES.ERROR.WATCHLIST.ENTER_NAME);
        try {
            const newW = await watchlistService.createWatchlist(userId, { name: formData.name.trim() });
            toast.success(MESSAGES.SUCCESS.WATCHLIST.CREATED);
            setShowCreateModal(false);
            setFormData({ name: "", description: "" });

            await queryClient.invalidateQueries(['watchlists', userId]);
            // Auto select new watchlist
            handleSelectWatchlist(newW);
        } catch (err) {
            toast.error(err.response?.data?.message || MESSAGES.ERROR.WATCHLIST.CREATE_FAILED);
        }
    };

    const handleUpdateWatchlist = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error(MESSAGES.ERROR.WATCHLIST.ENTER_NAME);
        try {
            await watchlistService.updateWatchlist(editingWatchlist.id, userId, { name: formData.name.trim() });
            toast.success(MESSAGES.SUCCESS.WATCHLIST.UPDATED);
            setShowEditModal(false);
            setEditingWatchlist(null);
            setFormData({ name: "", description: "" });

            await queryClient.invalidateQueries(['watchlists', userId]);
        } catch (err) {
            toast.error(err.response?.data?.message || MESSAGES.ERROR.WATCHLIST.UPDATE_FAILED);
        }
    };

    const handleDeleteWatchlist = async () => {
        try {
            await watchlistService.deleteWatchlist(deletingWatchlist.id, userId);
            toast.success(MESSAGES.SUCCESS.WATCHLIST.DELETED);
            setShowDeleteModal(false);
            setDeletingWatchlist(null);
            await queryClient.invalidateQueries(['watchlists', userId]);
            // Logic to select another watchlist (handled by useEffect automatically if current is gone)
        } catch (err) {
            toast.error(err.response?.data?.message || MESSAGES.ERROR.WATCHLIST.DELETE_FAILED);
        }
    };

    const handleAddStock = async (stockId) => {
        if (!selectedWatchlist) return toast.error(MESSAGES.ERROR.WATCHLIST.SELECT_REQUIRED);
        try {
            await watchlistService.addStockToWatchlist(selectedWatchlist.id, userId, { stockId });
            toast.success(MESSAGES.SUCCESS.WATCHLIST.STOCK_ADDED);
            setShowAddStockModal(false);
            setStockSearchQuery("");
            setAvailableStocks([]);

            // Invalidate stocks for this watchlist AND watchlists (stock count changes)
            await Promise.all([
                queryClient.invalidateQueries(['watchlistStocks', selectedWatchlist.id]),
                queryClient.invalidateQueries(['watchlists', userId])
            ]);
        } catch (err) {
            toast.error(err.response?.data?.message || MESSAGES.ERROR.WATCHLIST.ADD_STOCK_FAILED);
        }
    };

    const handleRemoveStock = async (stockId) => {
        try {
            await watchlistService.removeStockFromWatchlist(selectedWatchlist.id, userId, stockId);
            toast.success(MESSAGES.SUCCESS.WATCHLIST.STOCK_REMOVED);

            // Invalidate stocks for this watchlist AND watchlists (stock count changes)
            await Promise.all([
                queryClient.invalidateQueries(['watchlistStocks', selectedWatchlist.id]),
                queryClient.invalidateQueries(['watchlists', userId])
            ]);
        } catch (err) {
            toast.error(err.response?.data?.message || MESSAGES.ERROR.WATCHLIST.REMOVE_STOCK_FAILED);
        }
    };

    const openEditModal = (watchlist) => {
        setEditingWatchlist(watchlist);
        setFormData({ name: watchlist.name, description: watchlist.description || "" });
        setShowEditModal(true);
    };

    const handleRefresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries(['watchlistStocks', selectedWatchlist?.id]),
            queryClient.invalidateQueries(['watchlists', userId])
        ]);
    };

    const openDeleteModal = (watchlist) => {
        setDeletingWatchlist(watchlist);
        setShowDeleteModal(true);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Star className="h-7 w-7 text-primary" />
                            My Watchlists
                        </h1>
                        <p className="text-muted-foreground">Manage and track your customized stock lists</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => navigate('/explore')} variant="outline" size="sm" className="gap-2">
                            <TrendingUp className="h-4 w-4" /> Explore Stocks
                        </Button>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={isFetchingWatchlists || isFetchingStocks}
                        >
                            <RefreshCw className={cn("h-4 w-4", (isFetchingWatchlists || isFetchingStocks) && "animate-spin")} /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Tags / Tabs List */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {watchlistsLoading ? (
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-9 w-24 bg-secondary/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {watchlists.map(watchlist => {
                                const isSelected = selectedWatchlist?.id === watchlist.id;
                                return (
                                    <button
                                        key={watchlist.id}
                                        onClick={() => handleSelectWatchlist(watchlist)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                                                : "bg-card hover:bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <FolderOpen className={cn("h-4 w-4", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                                        {watchlist.name}
                                        <span className={cn("ml-1 text-xs px-1.5 py-0.5 rounded-full", isSelected ? "bg-white/20" : "bg-secondary")}>
                                            {watchlist.stockCount || 0}
                                        </span>
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors whitespace-nowrap"
                            >
                                <Plus className="h-4 w-4" />
                                New List
                            </button>
                        </>
                    )}
                </div>

                <div className="min-h-[500px]">
                    <WatchlistDetails
                        selectedWatchlist={selectedWatchlist || (watchlistsLoading ? { name: "Loading...", description: "Please wait" } : null)}
                        watchlistStocks={watchlistStocks}
                        stocksLoading={stocksLoading}
                        stocksPage={stocksPage}
                        stocksTotalPages={stocksTotalPages}
                        stocksTotalElements={stocksTotalElements}
                        onAddStockClick={() => setShowAddStockModal(true)}
                        onRemoveStock={handleRemoveStock}
                        onPageChange={handlePageChange}
                        onEditClick={openEditModal}
                        onDeleteClick={openDeleteModal}
                    />
                </div>

                <WatchlistModals
                    showCreateModal={showCreateModal}
                    onCreateClose={() => { setShowCreateModal(false); setFormData({ name: "", description: "" }); }}
                    formData={formData}
                    onFormChange={setFormData}
                    onCreateSubmit={handleCreateWatchlist}

                    showEditModal={showEditModal}
                    onEditClose={() => { setShowEditModal(false); setEditingWatchlist(null); setFormData({ name: "", description: "" }); }}
                    onEditSubmit={handleUpdateWatchlist}

                    showDeleteModal={showDeleteModal}
                    deletingWatchlist={deletingWatchlist}
                    onDeleteClose={() => { setShowDeleteModal(false); setDeletingWatchlist(null); }}
                    onDeleteConfirm={handleDeleteWatchlist}

                    showAddStockModal={showAddStockModal}
                    onAddStockClose={() => { setShowAddStockModal(false); setStockSearchQuery(""); setAvailableStocks([]); }}
                    stockSearchQuery={stockSearchQuery}
                    onStockSearchChange={setStockSearchQuery}
                    onStockSearch={searchStocks}
                    availableStocks={availableStocks}
                    onAddStock={handleAddStock}
                    stocksLoading={stockSearchLoading}
                />
            </div>
        </>
    );
}