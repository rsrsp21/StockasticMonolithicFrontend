import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
    Building2,
    Tag,
    TrendingUp,
    BarChart3,
    FileText,
    Upload,
    X,
    CheckCircle2,
} from "lucide-react";

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

const EXCHANGES = [
    "NSE",
    "BSE",
    "NASDAQ",
    "NYSE",
    "AMEX",
    "LSE",
    "TSX",
    "TSE",
    "HKEX",
    "SSE",
    "SZSE",
    "ASX",
    "EURONEXT",
];

export function StockFormFields({
    formData,
    setFormData,
    imagePreview,
    onImageUpload,
    onImageRemove,
}) {
    return (
        <div className="space-y-4">
            {/* Symbol & Name Row */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="symbol" className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Stock Symbol *
                    </Label>
                    <Input
                        id="symbol"
                        placeholder="AAPL"
                        value={formData.symbol}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                symbol: e.target.value.toUpperCase(),
                            })
                        }
                        className="font-mono"
                        maxLength={10}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Company Name *
                    </Label>
                    <Input
                        id="name"
                        placeholder="Apple Inc."
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                    />
                </div>
            </div>

            {/* Exchange & Sector Row */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        Exchange *
                    </Label>
                    <Select
                        value={formData.exchange}
                        onValueChange={(value) =>
                            setFormData({ ...formData, exchange: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select exchange" />
                        </SelectTrigger>
                        <SelectContent>
                            {EXCHANGES.map((ex) => (
                                <SelectItem key={ex} value={ex}>
                                    {ex}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        Sector
                    </Label>
                    <Select
                        value={formData.sector}
                        onValueChange={(value) =>
                            setFormData({ ...formData, sector: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                            {SECTORS.map((sec) => (
                                <SelectItem key={sec} value={sec}>
                                    {sec}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Description
                </Label>
                <Textarea
                    id="description"
                    placeholder="Brief description of the company..."
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                    }
                    className="min-h-[80px] resize-none"
                    maxLength={500}
                />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Stock Logo
                </Label>
                {!imagePreview ? (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <input
                            id="stock-img"
                            type="file"
                            accept="image/webp"
                            onChange={onImageUpload}
                            className="hidden"
                        />
                        <label
                            htmlFor="stock-img"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm font-medium">Click to upload</p>
                            <p className="text-xs text-muted-foreground">WEBP • Max 5MB</p>
                        </label>
                    </div>
                ) : (
                    <div className="relative inline-block">
                        <div className="h-20 w-20 rounded-lg border-2 overflow-hidden bg-muted">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={onImageRemove}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
                <div>
                    <Label className="text-base font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-positive-dark" />
                        Active Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Enable trading for this stock
                    </p>
                </div>
                <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                    }
                />
            </div>
        </div>
    );
}
