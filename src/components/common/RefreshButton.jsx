import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshButton({
    onClick,
    isLoading = false,
    label = "Refresh",
    loadingLabel,
    variant = "outline",
    size = "default",
    icon: Icon = RefreshCw,
    className = "",
    ...props
}) {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={onClick}
            disabled={isLoading}
            className={`gap-2 ${className}`}
            {...props}
        >
            <Icon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading && loadingLabel ? loadingLabel : label}
        </Button>
    );
}
