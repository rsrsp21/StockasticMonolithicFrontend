import { Bell, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useNotificationWebSocket } from "../../hooks/useNotificationWebSocket";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationWebSocket();
    const navigate = useNavigate();
    const getNotificationTargetPath = (notification) => (
        notification?.stockId ? `/stock/${notification.stockId}` : '/notifications'
    );

    const displayedNotifications = (notifications || []).slice(0, 3);
    const hasMore = (notifications || []).length > 3;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 group">
                    <Bell className="h-5 w-5 group-hover:text-primary transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-destructive-foreground bg-destructive rounded-full border-2 border-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 glass-card border-border/40 p-0">
                <div className="flex items-center justify-between p-4 border-b border-border/30">
                    <DropdownMenuLabel className="p-0 font-semibold text-foreground">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <div className="flex flex-col">
                    {(notifications || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col p-1">
                            {displayedNotifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.notificationId}
                                    className={`relative flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg focus:bg-muted/30 group ${!notification.isRead ? 'bg-muted/25' : ''}`}
                                    onClick={() => {
                                        if (!notification.isRead) markAsRead(notification.notificationId);
                                        navigate(getNotificationTargetPath(notification));
                                    }}
                                >
                                    <div className="flex items-start justify-between w-full gap-2 pr-6">
                                        <span className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </span>
                                        {!notification.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 w-full pr-4">
                                        {notification.message}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground/60 mt-1">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification.notificationId);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </div>

                {(hasMore || (notifications || []).length > 0) && (
                    <div className="p-2 border-t border-border/30">
                        <Button
                            variant="ghost"
                            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => navigate('/notifications')}
                        >
                            {hasMore ? `See all (${(notifications || []).length})` : 'View all history'}
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
