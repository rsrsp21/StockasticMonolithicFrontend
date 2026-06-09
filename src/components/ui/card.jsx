import * as React from "react";
import { cn } from "../../utils/utils";

const Card = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "glass-card",
        subtle: "glass-card-subtle",
        solid: "bg-card border border-border rounded-xl shadow-lg",
        outline: "bg-transparent border border-border/40 rounded-xl backdrop-blur-sm",
    };

    return (
        <div
            ref={ref}
            className={cn(
                variants[variant] || variants.default,
                "text-card-foreground",
                className
            )}
            {...props}
        />
    );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-xl font-semibold leading-none tracking-tight text-foreground",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
};
