// Notification system that generates notifications from real user actions
// Stored in localStorage, read by the notifications page

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: string; // icon name, resolved in component
    color: string;
}

const STORAGE_KEY = 'ou-notifications';

export function getNotifications(): AppNotification[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'time' | 'read'>) {
    const notifications = getNotifications();
    const newNotif: AppNotification = {
        ...notification,
        id: Date.now().toString(),
        time: 'Just now',
        read: false,
    };
    // Keep max 50 notifications
    const updated = [newNotif, ...notifications].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('notification', { detail: newNotif }));
    return newNotif;
}

export function markNotificationRead(id: string) {
    const notifications = getNotifications();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function markAllRead() {
    const notifications = getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteNotification(id: string) {
    const notifications = getNotifications();
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getUnreadCount(): number {
    return getNotifications().filter(n => !n.read).length;
}
