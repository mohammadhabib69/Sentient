import { create } from "zustand";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  addNotification: (notification) =>
    set((state) => {
      const next = [notification, ...state.notifications];
      return { notifications: next, unreadCount: state.unreadCount + 1 };
    }),
  markRead: (id) =>
    set((state) => {
      let isUnread = false;
      const next = state.notifications.map((n) => {
        if (n.id === id && !n.isRead) {
          isUnread = true;
          return { ...n, isRead: true };
        }
        return n;
      });
      return {
        notifications: next,
        unreadCount: isUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));
