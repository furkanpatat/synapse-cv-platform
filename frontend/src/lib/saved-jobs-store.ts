import { create } from "zustand";
import { userJobsApi } from "./jobs-user-api";

interface SavedJobsState {
  ids: Set<string>;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (jobId: string) => Promise<boolean>;
  isSaved: (jobId: string) => boolean;
}

export const useSavedJobsStore = create<SavedJobsState>((set, get) => ({
  ids: new Set(),
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const ids = await userJobsApi.savedIds();
      set({ ids: new Set(ids), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  toggle: async (jobId: string) => {
    const current = get().ids.has(jobId);
    // Optimistic update
    const next = new Set(get().ids);
    if (current) next.delete(jobId);
    else next.add(jobId);
    set({ ids: next });
    try {
      if (current) await userJobsApi.unsave(jobId);
      else await userJobsApi.save(jobId);
      return !current;
    } catch (err) {
      // Rollback
      const rollback = new Set(get().ids);
      if (current) rollback.add(jobId);
      else rollback.delete(jobId);
      set({ ids: rollback });
      throw err;
    }
  },
  isSaved: (jobId: string) => get().ids.has(jobId),
}));
