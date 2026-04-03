/*
 * Store setup: Store options:
  1) zustand (default)
  2) @reduxjs/toolkit (ecosystem)
  3) jotai (lightweight)
zustand (default)
 *
 * Recommended (zustand):
 * 1) pnpm add zustand
 * 2) Example:
 *    import { create } from "zustand";
 *    type State = { count: number; inc: () => void };
 *    export const useCounter = create<State>((set) => ({
 *      count: 0,
 *      inc: () => set((s) => ({ count: s.count + 1 })),
 *    }));
 */
export * from "./auth";
export * from "./messageInbox";
