import { create } from "zustand";

interface UIState {
  isProjectCreateDialogOpen: boolean;
  isTrackUploadDialogOpen: boolean;
  isVersionUploadDialogOpen: boolean;
  isShortcutHelpDialogOpen: boolean;
  focusCommentInput: boolean;
  triggerPlayback: boolean;
  
  setProjectCreateDialogOpen: (open: boolean) => void;
  setTrackUploadDialogOpen: (open: boolean) => void;
  setVersionUploadDialogOpen: (open: boolean) => void;
  setShortcutHelpDialogOpen: (open: boolean) => void;
  setFocusCommentInput: (focus: boolean) => void;
  setTriggerPlayback: (trigger: boolean) => void;
  
  // Helper to close everything
  closeAllDialogs: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isProjectCreateDialogOpen: false,
  isTrackUploadDialogOpen: false,
  isVersionUploadDialogOpen: false,
  isShortcutHelpDialogOpen: false,
  focusCommentInput: false,
  triggerPlayback: false,

  setProjectCreateDialogOpen: (open: boolean) => set({ isProjectCreateDialogOpen: open }),
  setTrackUploadDialogOpen: (open: boolean) => set({ isTrackUploadDialogOpen: open }),
  setVersionUploadDialogOpen: (open: boolean) => set({ isVersionUploadDialogOpen: open }),
  setShortcutHelpDialogOpen: (open: boolean) => set({ isShortcutHelpDialogOpen: open }),
  setFocusCommentInput: (focus: boolean) => set({ focusCommentInput: focus }),
  setTriggerPlayback: (trigger: boolean) => set({ triggerPlayback: trigger }),

  closeAllDialogs: () => set({
    isProjectCreateDialogOpen: false,
    isTrackUploadDialogOpen: false,
    isVersionUploadDialogOpen: false,
    isShortcutHelpDialogOpen: false,
    focusCommentInput: false,
    triggerPlayback: false,
  }),
}));
