import { Button } from "../ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

export function Pagination({
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    onPageChange,
    itemLabel = "items",
    isLoading = false,
}) {
    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    const canGoPrevious = currentPage > 0 && !isLoading;
    const canGoNext = currentPage < totalPages - 1 && !isLoading;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-secondary/20">
            <p className="text-sm text-muted-foreground">
                Showing {startItem} - {endItem} of {totalElements} {itemLabel}
            </p>

            <div className="flex items-center gap-1">
                {/* First Page */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(0)}
                    disabled={!canGoPrevious}
                    className="h-8 w-8 p-0"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Previous Page */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrevious}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Info */}
                <span className="px-3 text-sm font-medium text-foreground">
                    Page {currentPage + 1} of {totalPages || 1}
                </span>

                {/* Next Page */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(totalPages - 1)}
                    disabled={!canGoNext}
                    className="h-8 w-8 p-0"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
