import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "../../utils/utils";

export function StatCard({ title, value, change, changeType, icon: Icon, delay = 0, subtext }) {
    const isPositive = changeType === "positive";

    return (
        <div
            className="glass-card p-5 hover-lift animate-fade-in-up"
            style={{ animationDelay: `${delay}s` }}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{title}</span>
                <div className="feature-icon !w-10 !h-10 !rounded-xl">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{value}</div>
                {change && (
                    <div className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        isPositive ? "stock-up" : "stock-down"
                    )}>
                        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {change}
                        {subtext && <span className="text-muted-foreground font-normal ml-1">({subtext})</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
