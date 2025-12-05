import { create } from "zustand";

const useLogStore = create((set) => ({
  responseLog: "",
  setLogData: (newLog: string) =>
    set(() => ({
      responseLog: newLog,
    })),
  clearLogData: () => set({ responseLog: "" }),
}));

export default useLogStore;
