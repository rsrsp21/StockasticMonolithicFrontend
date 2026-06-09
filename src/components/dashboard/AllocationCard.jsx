import { PieChart } from "lucide-react";

export function AllocationCard({ holdings, delay = 0 }) {
    // Calculate sector allocation from holdings
    const sectorMap = {};
    let totalValue = 0;

    holdings.forEach(h => {
        const sector = h.sector || 'Other';
        sectorMap[sector] = (sectorMap[sector] || 0) + (h.currentValue || 0);
        totalValue += h.currentValue || 0;
    });

    const colors = ['#FF6B35', '#3DD17B', '#4F8EF7', '#FFB800', '#9B59B6', '#E84641'];
    const allocationData = Object.entries(sectorMap)
        .map(([name, value], i) => ({
            name,
            value: totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0,
            color: colors[i % colors.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    if (allocationData.length === 0) {
        return (
            <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Portfolio Allocation</h3>
                    <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center py-6 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No holdings yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: `${delay}s` }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Portfolio Allocation</h3>
                <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
                {allocationData.map((item, i) => (
                    <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span className="font-medium text-foreground">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${item.value}%`,
                                    backgroundColor: item.color,
                                    transitionDelay: `${i * 0.1}s`
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
