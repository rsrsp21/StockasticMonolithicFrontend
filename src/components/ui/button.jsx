import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5",
                destructive:
                    "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-lg shadow-destructive/25 hover:shadow-destructive/40 hover:-translate-y-0.5",
                outline:
                    "border border-border/40 bg-muted/30 backdrop-blur-sm hover:bg-muted/50 hover:border-border/70",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost:
                    "hover:bg-muted/50 hover:text-accent-foreground",
                link:
                    "text-primary underline-offset-4 hover:underline",
                glass:
                    "bg-muted/30 backdrop-blur-sm border border-border/40 hover:bg-muted/50 hover:border-border/70 shadow-lg",
                glow:
                    "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 animate-pulse-glow hover:-translate-y-0.5",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-9 rounded-lg px-4 text-xs",
                lg: "h-12 rounded-xl px-8",
                xl: "h-14 rounded-xl px-10 text-base",
                icon: "h-10 w-10 rounded-xl",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
