import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, X, Loader2 } from "lucide-react";

export function StockSearch({
    searchQuery,
    setSearchQuery,
    onSearch,
    onClear,
    isSearching,
}) {
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            onSearch();
        }
    };

    return (
        <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-foreground/55" />
                    <Input
                        placeholder="Search by symbol or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pl-10 glass-input"
                    />
                    {searchQuery && (
                        <button
                            onClick={onClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/55 hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button onClick={onSearch} disabled={isSearching} className="gap-2">
                    {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                    Search
                </Button>
            </div>
        </div>
    );
}
