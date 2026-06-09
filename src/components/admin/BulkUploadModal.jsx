import { useState, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Upload,
    Loader2,
    FileSpreadsheet,
    FileArchive,
    X,
    CheckCircle2,
    AlertCircle,
    SkipForward,
    Download,
    Info,
    ImageIcon,
} from "lucide-react";
import { MESSAGES } from "../../utils/constants/messages";
import { toast } from "sonner";
import { bulkUploadStocks } from "../../services/stockService";

const ACCEPTED_DATA_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export function BulkUploadModal({ open, onOpenChange, onUploadComplete }) {
    const [file, setFile] = useState(null);
    const [imagesZip, setImagesZip] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const fileInputRef = useRef(null);
    const zipInputRef = useRef(null);

    const resetState = () => {
        setFile(null);
        setImagesZip(null);
        setUploadResult(null);
        setIsUploading(false);
    };

    const handleClose = (isOpen) => {
        if (!isOpen) {
            resetState();
        }
        onOpenChange(isOpen);
    };

    const validateDataFile = (selectedFile) => {
        if (!selectedFile) return false;

        const fileName = selectedFile.name.toLowerCase();
        const isValidExtension = ACCEPTED_DATA_EXTENSIONS.some((ext) =>
            fileName.endsWith(ext)
        );

        if (!isValidExtension) {
            toast.error(MESSAGES.VALIDATION.BULK_FILE_TYPE);
            return false;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error("File must be less than 10MB");
            return false;
        }

        return true;
    };

    const validateZipFile = (selectedFile) => {
        if (!selectedFile) return false;

        const fileName = selectedFile.name.toLowerCase();
        if (!fileName.endsWith(".zip")) {
            toast.error("Images file must be a .zip archive");
            return false;
        }

        if (selectedFile.size > 50 * 1024 * 1024) {
            toast.error("Images ZIP must be less than 50MB");
            return false;
        }

        return true;
    };

    const handleFileSelect = (selectedFile) => {
        if (validateDataFile(selectedFile)) {
            setFile(selectedFile);
            setUploadResult(null);
        }
    };

    const handleZipSelect = (selectedFile) => {
        if (validateZipFile(selectedFile)) {
            setImagesZip(selectedFile);
        }
    };

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    }, []);

    const handleInputChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    const handleZipInputChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleZipSelect(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error(MESSAGES.VALIDATION.BULK_FILE_EMPTY);
            return;
        }

        setIsUploading(true);
        setUploadResult(null);

        try {
            const result = await bulkUploadStocks(file, imagesZip);
            setUploadResult(result);

            if (result.failureCount === 0 && result.skippedCount === 0) {
                toast.success(
                    `${MESSAGES.SUCCESS.STOCKS.BULK_UPLOAD_SUCCESS} ${result.successCount} stocks added.`
                );
            } else if (result.successCount > 0) {
                toast.warning(MESSAGES.SUCCESS.STOCKS.BULK_UPLOAD_PARTIAL);
            } else {
                toast.error(MESSAGES.SUCCESS.STOCKS.BULK_UPLOAD_FAILED);
            }

            if (result.successCount > 0 && onUploadComplete) {
                onUploadComplete();
            }
        } catch (err) {
            console.error(err);
            const message =
                err?.response?.data?.message ||
                MESSAGES.SUCCESS.STOCKS.BULK_UPLOAD_FAILED;
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "symbol,name,exchange,sector,description,isActive";
        const exampleRows = [
            "AAPL,Apple Inc.,NASDAQ,Technology,Consumer electronics and software,true",
            "GOOGL,Alphabet Inc.,NASDAQ,Technology,Search engine and cloud services,true",
            "TSLA,Tesla Inc.,NASDAQ,Automotive,Electric vehicles and clean energy,true",
        ];
        const csvContent = [headers, ...exampleRows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "stock_upload_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        Bulk Upload Stocks
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV or Excel file to add multiple stocks at
                        once, with optional stock logo images.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-5">
                    {/* Template Download Section */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Info className="h-4 w-4 text-blue-400 shrink-0" />
                        <p className="text-sm text-blue-300 flex-1">
                            Required columns:{" "}
                            <span className="font-semibold">
                                symbol, name, exchange
                            </span>
                            . Optional:{" "}
                            <span className="text-blue-400">
                                sector, description, isActive
                            </span>
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={downloadTemplate}
                            className="gap-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 shrink-0"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Template
                        </Button>
                    </div>

                    {/* Data File Drop Zone */}
                    {!uploadResult && (
                        <>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    Stock Data File{" "}
                                    <span className="text-red-400">*</span>
                                </label>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className={`
                                        relative flex flex-col items-center justify-center
                                        p-8 rounded-xl border-2 border-dashed cursor-pointer
                                        transition-all duration-300 ease-in-out
                                        ${isDragging
                                            ? "border-primary bg-primary/10 scale-[1.01]"
                                            : file
                                                ? "border-emerald-500/50 bg-emerald-500/5"
                                                : "border-border hover:border-primary/50 hover:bg-secondary/30"
                                        }
                                    `}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleInputChange}
                                        className="hidden"
                                        id="bulk-upload-input"
                                    />

                                    {file ? (
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="p-3 rounded-lg bg-emerald-500/20">
                                                <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFile(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className={`p-4 rounded-full mb-3 transition-colors ${isDragging
                                                        ? "bg-primary/20"
                                                        : "bg-secondary"
                                                    }`}
                                            >
                                                <Upload
                                                    className={`h-8 w-8 transition-colors ${isDragging
                                                            ? "text-primary"
                                                            : "text-muted-foreground"
                                                        }`}
                                                />
                                            </div>
                                            <p className="text-sm font-medium mb-1">
                                                {isDragging
                                                    ? "Drop the file here"
                                                    : "Drag & drop your file or click to browse"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Supports CSV, XLSX, and XLS
                                                files (max 10MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Images ZIP Upload (Optional) */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    Stock Images ZIP{" "}
                                    <span className="text-muted-foreground/60 text-xs font-normal">
                                        (optional)
                                    </span>
                                </label>
                                <div
                                    onClick={() =>
                                        zipInputRef.current?.click()
                                    }
                                    className={`
                                        relative flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer
                                        transition-all duration-300 ease-in-out
                                        ${imagesZip
                                            ? "border-violet-500/50 bg-violet-500/5"
                                            : "border-border hover:border-violet-500/40 hover:bg-secondary/30"
                                        }
                                    `}
                                >
                                    <input
                                        ref={zipInputRef}
                                        type="file"
                                        accept=".zip"
                                        onChange={handleZipInputChange}
                                        className="hidden"
                                        id="bulk-upload-zip-input"
                                    />

                                    {imagesZip ? (
                                        <>
                                            <div className="p-2.5 rounded-lg bg-violet-500/20">
                                                <FileArchive className="h-6 w-6 text-violet-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {imagesZip.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(
                                                        imagesZip.size
                                                    )}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImagesZip(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-2.5 rounded-lg bg-secondary">
                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    Upload images ZIP
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    ZIP with .webp images named
                                                    by symbol (e.g., AAPL.webp)
                                                    — max 50MB
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Upload Results */}
                    {uploadResult && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-1" />
                                    <span className="text-xl font-bold text-emerald-400">
                                        {uploadResult.successCount}
                                    </span>
                                    <span className="text-[11px] text-emerald-300/80">
                                        Added
                                    </span>
                                </div>
                                <div className="flex flex-col items-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <SkipForward className="h-5 w-5 text-yellow-400 mb-1" />
                                    <span className="text-xl font-bold text-yellow-400">
                                        {uploadResult.skippedCount}
                                    </span>
                                    <span className="text-[11px] text-yellow-300/80">
                                        Skipped
                                    </span>
                                </div>
                                <div className="flex flex-col items-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertCircle className="h-5 w-5 text-red-400 mb-1" />
                                    <span className="text-xl font-bold text-red-400">
                                        {uploadResult.failureCount}
                                    </span>
                                    <span className="text-[11px] text-red-300/80">
                                        Failed
                                    </span>
                                </div>
                            </div>

                            {/* Total processed */}
                            <p className="text-sm text-muted-foreground text-center">
                                Processed{" "}
                                <span className="font-medium text-foreground">
                                    {uploadResult.totalRows}
                                </span>{" "}
                                rows from{" "}
                                <span className="font-medium text-foreground">
                                    {file?.name}
                                </span>
                            </p>

                            {/* Error Details */}
                            {uploadResult.errors &&
                                uploadResult.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Details
                                        </p>
                                        <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-secondary/30">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-secondary">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                                                            Row
                                                        </th>
                                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                                                            Symbol
                                                        </th>
                                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                                                            Issue
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {uploadResult.errors.map(
                                                        (err, idx) => (
                                                            <tr
                                                                key={idx}
                                                                className="hover:bg-secondary/50"
                                                            >
                                                                <td className="px-3 py-1.5 text-muted-foreground">
                                                                    {err.row}
                                                                </td>
                                                                <td className="px-3 py-1.5 font-mono text-xs">
                                                                    {err.symbol ||
                                                                        "—"}
                                                                </td>
                                                                <td className="px-3 py-1.5 text-red-400 text-xs">
                                                                    {
                                                                        err.message
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {uploadResult ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => handleClose(false)}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    resetState();
                                }}
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Upload Another
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => handleClose(false)}
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                                className="gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Upload
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
