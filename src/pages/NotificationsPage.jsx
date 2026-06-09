import { Bell, Check, Clock, Info, Trash2, TrendingUp, RefreshCw } from "lucide-react";
import { RefreshButton } from "../components/common/RefreshButton";
import { Button } from "../components/ui/button";
import { cn } from "../utils/utils";
import { useNotificationWebSocket } from "../hooks/useNotificationWebSocket";
import { Pagination } from "../components/common/Pagination";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotificationsPage() {
    usePageTitle("Notifications");
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications
    } = useNotificationWebSocket();
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshNotifications();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    // Pagination Logic
    const paginatedNotifications = notifications.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(notifications.length / PAGE_SIZE);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-IN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Bell className="h-7 w-7 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Stay updated with your latest alerts and activities.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => navigate('/explore')} variant="outline" size="sm" className="gap-2">
                            <TrendingUp className="h-4 w-4" /> Explore Stocks
                        </Button>
                        <RefreshButton
                            onClick={handleRefresh}
                            isLoading={isRefreshing}
                            size="sm"
                        />
                        {notifications.some(n => !n.isRead) && (
                            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
                                <Check className="h-4 w-4" />
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-16 glass-card">
                        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium text-foreground">No notifications yet</h3>
                        <p className="text-muted-foreground">We'll let you know when something important happens.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginatedNotifications.map(notification => (
                            <div
                                key={notification.notificationId}
                                className={cn(
                                    "glass-card p-4 transition-all duration-200 border-l-4 flex gap-4 group relative pr-12",
                                    notification.isRead ? "border-transparent bg-white/5 opacity-80" : "border-primary bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                    notification.type === 'ALERT' ? 'bg-red-500/20 text-red-400' :
                                        notification.type === 'ORDER' ? 'bg-green-500/20 text-green-400' :
                                            'bg-blue-500/20 text-blue-400'
                                )}>
                                    <Info className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={cn("font-medium", notification.isRead ? "text-muted-foreground" : "text-foreground")}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {notification.message}
                                    </p>
                                    <div className="mt-2 flex items-center gap-3">
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification.notificationId)}
                                                className="text-xs text-primary hover:text-primary/80 font-medium"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                        {notification.stockId && (
                                            <button
                                                onClick={() => {
                                                    if (!notification.isRead) {
                                                        markAsRead(notification.notificationId);
                                                    }
                                                    navigate(`/stock/${notification.stockId}`);
                                                }}
                                                className="text-xs text-primary hover:text-primary/80 font-medium"
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
                                    onClick={() => deleteNotification(notification.notificationId)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {/* Pagination */}
                        {notifications.length > 0 && (
                            <div className="mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalElements={notifications.length}
                                    pageSize={PAGE_SIZE}
                                    onPageChange={handlePageChange}
                                    itemLabel="notifications"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
