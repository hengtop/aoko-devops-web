import { create } from "zustand";
import { listMyMessages, type MessageRecord } from "../service/api";

type MessageInboxState = {
  unreadCount: number;
  recentMessages: MessageRecord[];
  initialized: boolean;
  loading: boolean;
  refreshInbox: () => Promise<void>;
  markMessageReadLocally: (id: string) => void;
  resetInbox: () => void;
};

export const useMessageInboxStore = create<MessageInboxState>((set) => ({
  unreadCount: 0,
  recentMessages: [],
  initialized: false,
  loading: false,
  async refreshInbox() {
    set((state) => ({
      loading: !state.initialized,
    }));

    try {
      const [recentResponse, unreadResponse] = await Promise.all([
        listMyMessages({
          pageNum: 1,
          pageSize: 5,
        }),
        listMyMessages({
          pageNum: 1,
          pageSize: 1,
          read_status: "unread",
        }),
      ]);

      set({
        recentMessages: recentResponse.success ? recentResponse.data?.list ?? [] : [],
        unreadCount: unreadResponse.success ? unreadResponse.data?.total ?? 0 : 0,
        initialized: true,
        loading: false,
      });
    } catch {
      set({
        initialized: true,
        loading: false,
      });
    }
  },
  markMessageReadLocally(id) {
    set((state) => {
      const nextRecentMessages = state.recentMessages.map((item) => {
        if (item.id !== id || item.read_status === "read") {
          return item;
        }

        return {
          ...item,
          read_status: "read" as const,
          readAt: Date.now(),
        };
      });

      const isUnreadBefore = state.recentMessages.some(
        (item) => item.id === id && item.read_status !== "read",
      );

      return {
        recentMessages: nextRecentMessages,
        unreadCount: isUnreadBefore ? Math.max(state.unreadCount - 1, 0) : state.unreadCount,
      };
    });
  },
  resetInbox() {
    set({
      unreadCount: 0,
      recentMessages: [],
      initialized: false,
      loading: false,
    });
  },
}));
