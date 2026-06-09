import { cn } from "../../utils/utils";
/**
 * MetricCard.jsx
 * 
 * A reusable component to display a single key performance indicator (KPI) or statistic.
 * Examples: "Total Portfolio Value", "Today's Gain/Loss", "Available Balance".
 * 
 * Props:
 * - title: Label at the top (e.g., "Current Balance")
 * - value: Main number shown in large, bold text
 * - icon: Optional icon displayed in top-right
 * - change: Recent performance text (e.g., "+5%")
 * - changeType: Controls color of change text ("positive"->Green, "negative"->Red, "neutral"->Gray)
 */
export function MetricCard({ title, value, change, changeType = "neutral", icon: Icon, className }) {
  return (<div className={cn("rounded-lg border border-border bg-card p-5", className)}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {Icon && (<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>)}
    </div>
    <div className="mt-2 text-2xl font-bold text-foreground font-mono">{value}</div>
    {change && (<p className={cn("mt-1 text-sm font-medium", changeType === "positive" && "text-success", changeType === "negative" && "text-destructive", changeType === "neutral" && "text-muted-foreground")}>
      {change}
    </p>)}
  </div>);
}
