/**
 * Market Section - Reusable section wrapper with icon header
 */
export const MarketSection = ({ icon: Icon, title, iconColor, iconBg, children, description }) => (
    <section className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${iconBg} border border-border/30`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
        </div>
        {children}
    </section>
);
