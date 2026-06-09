export function StatCard({ icon, label, value, subtext }) {
    return (
        <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                {icon}
                <span className="text-sm">{label}</span>
            </div>
            <p className="text-xl font-bold">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
    );
}
