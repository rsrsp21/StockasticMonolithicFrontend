import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { X, Filter } from "lucide-react";
import { useEffect, useState } from "react";

const SECTORS = [
    "Automobile",
    "Banking",
    "Building Materials",
    "Cement",
    "Chemicals",
    "Conglomerate",
    "Consumer Electronics",
    "Consumer Goods",
    "Consumer Services",
    "Defence",
    "Energy",
    "Engineering",
    "Financial Services",
    "FMCG",
    "Healthcare",
    "Infrastructure",
    "Insurance",
    "Logistics",
    "Materials",
    "Media",
    "Metals",
    "Mining",
    "Pharmaceuticals",
    "Real Estate",
    "Retail",
    "Technology",
    "Telecom",
    "Textile",
    "Travel",
];

const EXCHANGES = ["NSE", "BSE"];

import { FILTER_DEFAULTS } from "../../utils/constants";


export function StockFilters({ filters, setFilters, onApply, onClear }) {
    // Local state for sliders to ensure smooth dragging
    const [priceRange, setPriceRange] = useState([FILTER_DEFAULTS.price.min, FILTER_DEFAULTS.price.max]);
    const [volumeRange, setVolumeRange] = useState([FILTER_DEFAULTS.volume.min, FILTER_DEFAULTS.volume.max]);

    // Sync local state with parent filters on mount or reset
    useEffect(() => {
        setPriceRange([
            filters.minPrice !== "" ? Number(filters.minPrice) : FILTER_DEFAULTS.price.min,
            filters.maxPrice !== "" ? Number(filters.maxPrice) : FILTER_DEFAULTS.price.max,
        ]);
        setVolumeRange([
            filters.minVolume !== "" ? Number(filters.minVolume) : FILTER_DEFAULTS.volume.min,
            filters.maxVolume !== "" ? Number(filters.maxVolume) : FILTER_DEFAULTS.volume.max,
        ]);
    }, [filters]);

    const handlePriceSliderChange = (value) => {
        setPriceRange(value);
        setFilters((prev) => ({
            ...prev,
            minPrice: value[0],
            maxPrice: value[1],
        }));
    };

    const handleVolumeSliderChange = (value) => {
        setVolumeRange(value);
        setFilters((prev) => ({
            ...prev,
            minVolume: value[0],
            maxVolume: value[1],
        }));
    };

    const handleInputChange = (type, index, value) => {
        const newValue = Number(value);
        if (type === "price") {
            const newRange = [...priceRange];
            newRange[index] = newValue;
            setPriceRange(newRange);
            setFilters((prev) => ({
                ...prev,
                [index === 0 ? "minPrice" : "maxPrice"]: newValue,
            }));
        } else {
            const newRange = [...volumeRange];
            newRange[index] = newValue;
            setVolumeRange(newRange);
            setFilters((prev) => ({
                ...prev,
                [index === 0 ? "minVolume" : "maxVolume"]: newValue,
            }));
        }
    };

    return (
        <div className="glass-card p-4 space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sector Filter */}
                <div className="space-y-3">
                    <Label className="text-xs">Sector</Label>
                    <Select
                        value={filters.sector || "all"}
                        onValueChange={(val) =>
                            setFilters((prev) => ({ ...prev, sector: val === "all" ? "" : val }))
                        }
                    >
                        <SelectTrigger className="h-9 bg-background/50 border-border/40">
                            <SelectValue placeholder="All Sectors" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sectors</SelectItem>
                            {SECTORS.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Exchange Filter */}
                <div className="space-y-3">
                    <Label className="text-xs">Exchange</Label>
                    <Select
                        value={filters.exchange || "all"}
                        onValueChange={(val) =>
                            setFilters((prev) => ({ ...prev, exchange: val === "all" ? "" : val }))
                        }
                    >
                        <SelectTrigger className="h-9 bg-background/50 border-border/40">
                            <SelectValue placeholder="All Exchanges" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Exchanges</SelectItem>
                            {EXCHANGES.map((e) => (
                                <SelectItem key={e} value={e}>
                                    {e}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Volume Filter (Slider + Inputs) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <Label>Volume</Label>
                        <span className="text-muted-foreground">
                            {volumeRange[0].toLocaleString('en-IN')} - {volumeRange[1].toLocaleString('en-IN')}
                        </span>
                    </div>
                    <Slider
                        value={volumeRange}
                        min={0}
                        max={FILTER_DEFAULTS.volume.max}
                        step={1000}
                        minStepsBetweenThumbs={1}
                        onValueChange={handleVolumeSliderChange}
                        className="py-2"
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={volumeRange[0]}
                            onChange={(e) => handleInputChange("volume", 0, e.target.value)}
                            className="h-8 text-xs bg-background/50 border-border/40"
                            min={0}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="number"
                            value={volumeRange[1]}
                            onChange={(e) => handleInputChange("volume", 1, e.target.value)}
                            className="h-8 text-xs bg-background/50 border-border/40"
                            min={0}
                        />
                    </div>
                </div>

                {/* Price Range Filter (Slider + Inputs) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <Label>Price (₹)</Label>
                        <span className="text-muted-foreground">
                            {priceRange[0].toLocaleString('en-IN')} - {priceRange[1].toLocaleString('en-IN')}
                        </span>
                    </div>
                    <Slider
                        value={priceRange}
                        min={0}
                        max={20000}
                        step={5}
                        minStepsBetweenThumbs={1}
                        onValueChange={handlePriceSliderChange}
                        className="py-2"
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) => handleInputChange("price", 0, e.target.value)}
                            className="h-8 text-xs bg-background/50 border-border/40"
                            min={0}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) => handleInputChange("price", 1, e.target.value)}
                            className="h-8 text-xs bg-background/50 border-border/40"
                            min={0}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-end gap-2">
                    <Button
                        onClick={onApply}
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Apply Filters
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClear}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                        title="Clear Filters"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
