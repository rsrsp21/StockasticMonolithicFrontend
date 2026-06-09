import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card p-3 border border-border/40 bg-card/80 backdrop-blur-md">
                <p className="text-muted-foreground text-xs mb-1">{label}</p>
                <p className="text-foreground font-bold text-lg">
                    ₹{payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export function PortfolioChart({ invested, currentValue, positive = true }) {
    const color = positive ? "#3DD17B" : "#E84641";

    // Create simple two-point data
    const data = [
        { label: 'Invested', value: invested || 0 },
        { label: 'Current', value: currentValue || 0 }
    ];

    if (!invested && !currentValue) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center text-muted-foreground">
                <p>No portfolio data available</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.55} />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
                        domain={['dataMin - 500', 'dataMax + 500']}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        dot={{ r: 6, strokeWidth: 2, stroke: color, fill: '#1a1f2e' }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
