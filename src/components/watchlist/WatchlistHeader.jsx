import { Star, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { RefreshButton } from "../common/RefreshButton";

export function WatchlistHeader({ loading, onRefresh, onCreateClick }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Star className="h-7 w-7 text-primary" />
                    My Watchlists
                </h1>
                <p className="text-muted-foreground">
                    Organize and track your favorite stocks
                </p>
            </div>

            <div className="flex gap-3">
                <RefreshButton
                    onClick={onRefresh}
                    isLoading={loading}
                />
                <Button
                    onClick={onCreateClick}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Create Watchlist
                </Button>
            </div>
        </div>
    );
}
