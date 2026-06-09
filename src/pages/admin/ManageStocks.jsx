import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";
import { MESSAGES } from "../../utils/constants/messages";
import { Button } from "../../components/ui/button";
import { Plus, Upload, ArrowUp, ArrowDown } from "lucide-react";
import { RefreshButton } from "../../components/common/RefreshButton";
import { toast } from "sonner";

// Stock components
import { StockTable } from "../../components/common/StockTable";
import { StockFilters } from "../../components/common/StockFilters";
import { FILTER_DEFAULTS } from "../../utils/constants";
import { StockSearch } from "../../components/admin/StockSearch";
import { StockModal } from "../../components/admin/StockModal";
import { DeleteStockDialog } from "../../components/admin/DeleteStockDialog";
import { BulkUploadModal } from "../../components/admin/BulkUploadModal";
import { Pagination } from "../../components/common/Pagination";

// Stock service
import {
    getStocksPaged,
    createStock,
    updateStock,
    deleteStock,
} from "../../services/stockService";
import { usePageTitle } from "../../hooks/usePageTitle";

const INITIAL_FORM_DATA = {
    symbol: "",
    name: "",
    exchange: "",
    sector: "",
    description: "",
    isActive: true,
};

const PAGE_SIZE = 10;

export default function ManageStocks() {
    usePageTitle("Manage Stocks");
    // Stock list state
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    // Filter state
    const [filters, setFilters] = useState({
        sector: "",
        exchange: "",
        minPrice: "",
        maxPrice: "",
        minVolume: "",
        maxVolume: ""
    });
    const [appliedFilters, setAppliedFilters] = useState({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sortBy, setSortBy] = useState("");
    const [sortDir, setSortDir] = useState("asc");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedStock, setSelectedStock] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stockToDelete, setStockToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk upload modal state
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

    // Fetch stocks with pagination and filters
    const fetchStocks = useCallback(async (
        page = 0,
        query = "",
        activeFilters = {},
        activeSortBy = sortBy,
        activeSortDir = sortDir
    ) => {
        setLoading(true);
        try {
            const resolvedSortBy = activeSortBy || "symbol";
            const resolvedSortDir = activeSortBy ? activeSortDir : "asc";
            const data = await getStocksPaged(
                page,
                PAGE_SIZE,
                resolvedSortBy,
                resolvedSortDir,
                query,
                activeFilters
            );
            setStocks(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
            // Use API page number if available, otherwise fallback to requested page
            setCurrentPage(data.number !== undefined ? data.number : page);
        } catch (err) {
            console.error(err);
            toast.error(MESSAGES.ERROR.LOAD_STOCKS_FAILED);
        } finally {
            setLoading(false);
        }
    }, [sortBy, sortDir]);

    useEffect(() => {
        fetchStocks(0, "", {}, sortBy, sortDir);
    }, [fetchStocks]);

    // Handle search
    const handleSearch = () => {
        setAppliedSearch(searchQuery);
        setCurrentPage(0);
        fetchStocks(0, searchQuery, appliedFilters, sortBy, sortDir);
    };

    // Handle Filter Apply
    const handleApplyFilters = () => {
        const activeFilters = { ...filters };

        // Clean up default ranges
        if (Number(activeFilters.minPrice) === FILTER_DEFAULTS.price.min &&
            Number(activeFilters.maxPrice) === FILTER_DEFAULTS.price.max) {
            delete activeFilters.minPrice;
            delete activeFilters.maxPrice;
        }

        if (Number(activeFilters.minVolume) === FILTER_DEFAULTS.volume.min &&
            Number(activeFilters.maxVolume) === FILTER_DEFAULTS.volume.max) {
            delete activeFilters.minVolume;
            delete activeFilters.maxVolume;
        }

        // Clean up empty strings
        if (!activeFilters.sector) delete activeFilters.sector;
        if (!activeFilters.exchange) delete activeFilters.exchange;

        setAppliedFilters(activeFilters);
        setCurrentPage(0);
        fetchStocks(0, appliedSearch, activeFilters, sortBy, sortDir);
    };

    // Handle Filter Clear
    const handleClearFilters = () => {
        const resetFilters = { sector: "", exchange: "", minPrice: "", maxPrice: "", minVolume: "", maxVolume: "" };
        setFilters(resetFilters);
        setAppliedFilters({});
        setCurrentPage(0);
        fetchStocks(0, appliedSearch, {}, sortBy, sortDir);
    };

    // Clear search (also clears filters)
    const clearSearch = () => {
        const resetFilters = { sector: "", exchange: "", minPrice: "", maxPrice: "", minVolume: "", maxVolume: "" };
        setSearchQuery("");
        setAppliedSearch("");
        setFilters(resetFilters);
        setAppliedFilters({});
        setCurrentPage(0);
        fetchStocks(0, "", {}, sortBy, sortDir);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchStocks(newPage, appliedSearch, appliedFilters, sortBy, sortDir);
    };

    const handleSortChange = (columnKey) => {
        if (sortBy === columnKey) {
            const nextSortDir = sortDir === "asc" ? "desc" : "asc";
            setSortDir(nextSortDir);
            setCurrentPage(0);
            fetchStocks(0, appliedSearch, appliedFilters, columnKey, nextSortDir);
            return;
        }

        setSortBy(columnKey);
        setSortDir("desc");
        setCurrentPage(0);
        fetchStocks(0, appliedSearch, appliedFilters, columnKey, "desc");
    };

    const renderSortHeader = (label, columnKey, align = "left") => {
        const isActive = sortBy === columnKey;
        const isAsc = sortDir === "asc";

        return (
            <button
                type="button"
                onClick={() => handleSortChange(columnKey)}
                className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${align === "right" ? "ml-auto" : ""}`}
                title={`Sort by ${label}`}
            >
                <span>{label}</span>
                {isActive ? (
                    isAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                ) : (
                    <ArrowUp className="h-3.5 w-3.5 opacity-30" />
                )}
            </button>
        );
    };

    // Image upload handler
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== "image/webp") {
            toast.error(MESSAGES.VALIDATION.IMAGE_FORMAT);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error(MESSAGES.VALIDATION.IMAGE_SIZE);
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    // Reset form
    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setImageFile(null);
        setImagePreview(null);
        setSelectedStock(null);
    };

    // Open Add modal
    const openAddModal = () => {
        resetForm();
        setModalMode("add");
        setModalOpen(true);
    };

    // Open Edit modal
    const openEditModal = (stock) => {
        setSelectedStock(stock);
        setFormData({
            symbol: stock.symbol || "",
            name: stock.name || "",
            exchange: stock.exchange || "",
            sector: stock.sector || "",
            description: stock.description || "",
            isActive: stock.isActive ?? true,
        });
        setImageFile(null);
        setImagePreview(
            stock.image ? `${API_ENDPOINTS.CONFIG.STOCK_IMAGE_URL}/${stock.image}` : null
        );
        setModalMode("edit");
        setModalOpen(true);
    };

    // Handle submit (add or edit)
    const handleSubmit = async () => {
        if (!formData.symbol || !formData.name || !formData.exchange) {
            toast.error(MESSAGES.VALIDATION.FILL_REQUIRED);
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode === "add") {
                await createStock(formData, imageFile);
                toast.success(MESSAGES.SUCCESS.STOCKS.ADDED);
            } else {
                await updateStock(selectedStock.stockId, formData, imageFile);
                toast.success(MESSAGES.SUCCESS.STOCKS.UPDATED);
            }
            setModalOpen(false);
            resetForm();
            fetchStocks(currentPage, appliedSearch);
        } catch (err) {
            console.error(err);
            const action = modalMode === "add" ? "add" : "update";
            toast.error(err?.response?.data?.message || `Failed to ${action} stock`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open delete confirmation
    const openDeleteDialog = (stock) => {
        setStockToDelete(stock);
        setDeleteDialogOpen(true);
    };

    // Handle delete stock
    const handleDeleteStock = async () => {
        if (!stockToDelete) return;
        setIsDeleting(true);
        try {
            await deleteStock(stockToDelete.stockId);
            toast.success(MESSAGES.SUCCESS.STOCKS.DELETED);
            setDeleteDialogOpen(false);
            // Refresh current page after delete
            fetchStocks(currentPage, appliedSearch);
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to delete stock");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header with Title and Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Manage Stocks</h1>
                        <p className="text-muted-foreground text-sm mt-1">Add, edit, or remove stocks from the platform</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total Stocks: <span className="font-semibold text-foreground">{totalElements.toLocaleString()}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <RefreshButton
                            variant="outline"
                            size="sm"
                            onClick={() => fetchStocks(currentPage, appliedSearch, appliedFilters)}
                            isLoading={loading}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBulkUploadOpen(true)}
                            className="gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Bulk Upload
                        </Button>
                        <Button
                            size="sm"
                            onClick={openAddModal}
                            className="gap-2 bg-primary hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" />
                            Add Stock
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <StockSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSearch={handleSearch}
                    onClear={clearSearch}
                    isSearching={loading}
                />

                {/* Filters */}
                <StockFilters
                    filters={filters}
                    setFilters={setFilters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                />

                {/* Stocks Table ... */}


                {/* Stocks Table */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-secondary/30">
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Stock", "name")}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("ID", "stockId")}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Symbol", "symbol")}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Exchange", "exchange")}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        {renderSortHeader("Sector", "sector")}
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <StockTable
                                    stocks={stocks}
                                    loading={loading}
                                    searchQuery={appliedSearch}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteDialog}
                                    showStockId
                                />
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalElements > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            pageSize={PAGE_SIZE}
                            onPageChange={handlePageChange}
                            isLoading={loading}
                        />
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <StockModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                mode={modalMode}
                formData={formData}
                setFormData={setFormData}
                imagePreview={imagePreview}
                onImageUpload={handleImageUpload}
                onImageRemove={clearImage}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteStockDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                stock={stockToDelete}
                onConfirm={handleDeleteStock}
                isDeleting={isDeleting}
            />

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                open={bulkUploadOpen}
                onOpenChange={setBulkUploadOpen}
                onUploadComplete={() => fetchStocks(currentPage, appliedSearch, appliedFilters)}
            />
        </>
    );
}
