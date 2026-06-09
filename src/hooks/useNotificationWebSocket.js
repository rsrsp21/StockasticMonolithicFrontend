import { useContext } from 'react';
import { NotificationContext } from '../context/notificationContextInstance';

export const useNotificationWebSocket = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationWebSocket must be used within a NotificationProvider');
    }
    return context;
};
