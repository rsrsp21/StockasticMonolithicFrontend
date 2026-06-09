import * as React from "react";
import { cn } from "../../utils/utils";

const Input = React.forwardRef(({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-muted/30 border-border/40 focus:border-primary/50 focus:bg-muted/50",
        solid: "bg-input border-input focus:border-ring",
        glass: "bg-muted/30 backdrop-blur-sm border-border/40 focus:border-primary/50 focus:bg-muted/50 focus:shadow-[0_0_20px_rgba(255,86,64,0.15)]",
    };

    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-xl border px-4 py-2 text-sm text-foreground",
                "ring-offset-background transition-all duration-200",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0",
                "disabled:cursor-not-allowed disabled:opacity-50",
                variants[variant] || variants.default,
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";

export { Input };
