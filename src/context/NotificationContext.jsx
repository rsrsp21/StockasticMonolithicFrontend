import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import axiosInstance from '../api/axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';
import { MESSAGES } from '../utils/constants/messages';
import { getNotificationWebSocketEndpoint } from '../utils/websocket';
import { logout, setCredentials } from '../store/slices/authSlice';
import { NotificationContext } from './notificationContextInstance';

export const NotificationProvider = ({ children }) => {
    const { user, token, isAuthenticated } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const shouldReconnectRef = useRef(true);
    const refreshInProgressRef = useRef(false);
    const seenNotificationIdsRef = useRef(new Set());
    const tokenRef = useRef(token);
    const navigate = useNavigate();
    const navigateRef = useRef(navigate);

    const normalizeNotification = useCallback((notification) => ({
        ...notification,
        isRead: notification?.isRead !== undefined
            ? notification.isRead
            : (notification?.read !== undefined ? notification.read : false)
    }), []);

    const syncSeenNotificationIds = useCallback((items) => {
        seenNotificationIdsRef.current = new Set(
            (items || [])
                .map((item) => item?.notificationId)
                .filter((id) => id !== null && id !== undefined)
        );
    }, []);

    useEffect(() => {
        navigateRef.current = navigate;
    }, [navigate]);

    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    const getNotificationTargetPath = useCallback((notification) => {
        if (notification?.stockId) {
            return `/stock/${notification.stockId}`;
        }
        return '/notifications';
    }, []);

    // Initial fetch of unread count and latest notifications
    const fetchNotifications = useCallback(async () => {
        // Wait for full authentication (token + user id)
        if (!isAuthenticated || !user?.userId || !token) return;
        try {
            const countRes = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
            setUnreadCount(Number(countRes.data) || 0);

            const listRes = await axiosInstance.get(`${API_ENDPOINTS.NOTIFICATIONS.BASE}?page=0&size=50`);
            const notificationsData = listRes.data.content || [];
            const normalizedNotifications = notificationsData.map(normalizeNotification);
            syncSeenNotificationIds(normalizedNotifications);
            setNotifications(normalizedNotifications);
        } catch (error) {
            if (error.response?.status === 401) {
                console.warn('Unauthorized to fetch notifications. Token might be invalid or expired.');
            } else {
                console.error('Failed to fetch notifications', error);
            }
        }
    }, [user?.userId, token, isAuthenticated, normalizeNotification, syncSeenNotificationIds]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        // Wait for full authentication before connecting WebSocket.
        // Use stable primitives so route changes don't trigger reconnects.
        if (!isAuthenticated || !user?.userId || !token) return;

        shouldReconnectRef.current = true;
        const socketUrl = getNotificationWebSocketEndpoint();

        const refreshAccessToken = async () => {
            if (refreshInProgressRef.current) {
                return false;
            }

            refreshInProgressRef.current = true;
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refreshtoken`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = response.data || {};
                if (!accessToken) {
                    return false;
                }

                dispatch(setCredentials({ token: accessToken }));
                return true;
            } catch (error) {
                dispatch(logout());
                try {
                    await axios.post(
                        `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
                        {},
                        { withCredentials: true }
                    );
                } catch {
                    // Ignore logout cleanup failure.
                }
                navigateRef.current('/login');
                return false;
            } finally {
                refreshInProgressRef.current = false;
            }
        };

        const connect = () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            const latestToken = tokenRef.current;
            if (!latestToken) {
                return;
            }

            const tokenParam = encodeURIComponent(latestToken);
            const url = `${socketUrl}${socketUrl.includes('?') ? '&' : '?'}access_token=${tokenParam}`;
            const socket = new WebSocket(url);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log('Connected to Notification WebSocket');
                setIsConnected(true);
            };

            socket.onmessage = (event) => {
                const notification = normalizeNotification(JSON.parse(event.data));
                const notificationId = notification?.notificationId;

                if (notificationId !== null && notificationId !== undefined) {
                    if (seenNotificationIdsRef.current.has(notificationId)) {
                        return;
                    }
                    seenNotificationIdsRef.current.add(notificationId);
                }

                setNotifications(prev => [notification, ...prev]);
                if (!notification.isRead) {
                    setUnreadCount(prev => prev + 1);
                }

                try {
                    const audio = new Audio(API_ENDPOINTS.NOTIFICATIONS.SOUND_URL);
                    audio.volume = 0.5;
                    audio.play().catch(e => console.log("Audio play failed (user interaction required first):", e));
                } catch (e) {
                    console.error("Audio error", e);
                }

                toast(notification.title, {
                    description: notification.message,
                    duration: 5000,
                    action: {
                        label: 'View',
                        onClick: () => {
                            console.log('View notification', notification.notificationId);
                            navigateRef.current(getNotificationTargetPath(notification));
                        },
                    },
                });
            };

            socket.onclose = (event) => {
                console.log('Disconnected from Notification WebSocket');
                setIsConnected(false);
                if (!shouldReconnectRef.current) {
                    return;
                }

                if (event?.code === 4401) {
                    refreshAccessToken().then((refreshed) => {
                        if (!refreshed || !shouldReconnectRef.current) {
                            return;
                        }
                        reconnectTimeoutRef.current = setTimeout(connect, 250);
                    });
                    return;
                }

                if (shouldReconnectRef.current) {
                    reconnectTimeoutRef.current = setTimeout(connect, 5000);
                }
            };

            socket.onerror = (error) => {
                console.error('Notification WebSocket error', error);
            };
        };

        connect();

        return () => {
            shouldReconnectRef.current = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }
        };
    }, [user?.userId, token, isAuthenticated, getNotificationTargetPath, normalizeNotification]);

    const markAsRead = async (id) => {
        try {
            await axiosInstance.put(API_ENDPOINTS.NOTIFICATIONS.READ(id));
            let unreadDelta = 0;
            setNotifications(prev => prev.map(n => {
                if (n.notificationId === id && !n.isRead) {
                    unreadDelta = 1;
                    return { ...n, isRead: true };
                }
                return n;
            }));
            if (unreadDelta > 0) {
                setUnreadCount(prev => Math.max(0, prev - unreadDelta));
            }
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axiosInstance.put(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success(MESSAGES.NOTIFICATIONS.READ_ALL);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axiosInstance.delete(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id));
            let removedUnread = 0;
            setNotifications(prev => prev.filter(n => {
                if (n.notificationId === id) {
                    if (!n.isRead) {
                        removedUnread = 1;
                    }
                    return false;
                }
                return true;
            }));
            seenNotificationIdsRef.current.delete(id);
            if (removedUnread > 0) {
                setUnreadCount(prev => Math.max(0, prev - removedUnread));
            }
            toast.success(MESSAGES.NOTIFICATIONS.DELETED);
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isConnected,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            refreshNotifications: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
