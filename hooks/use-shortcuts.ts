"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { useUIStore } from "@/stores/uiStore";
import { useRouter, usePathname } from "next/navigation";

export function useShortcuts() {
  const { waveSurfer, isPlaying, setIsPlaying } = usePlayerStore();
  const {
    setProjectCreateDialogOpen,
    setTrackUploadDialogOpen,
    setVersionUploadDialogOpen,
    isShortcutHelpDialogOpen,
    setShortcutHelpDialogOpen,
    setFocusCommentInput,
    setTriggerPlayback,
  } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const chordRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in an input or textarea
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute("contenteditable") ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (e.key === "Escape") {
        if (activeElement instanceof HTMLElement) {
          activeElement.blur();
        }
        chordRef.current = null;
        return;
      }

      if (isTyping) return;

      // Handle chord shortcuts (g + ...)
      if (chordRef.current === "g") {
        chordRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        switch (e.key.toLowerCase()) {
          case "h":
            e.preventDefault();
            router.push("/projects");
            return;
          case "p":
            e.preventDefault();
            // Extract project ID from path if we are deeper
            const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
            if (projectMatch) {
              router.push(`/projects/${projectMatch[1]}`);
            }
            return;
          case "l":
            if (pathname.includes("/tracks/") && !pathname.endsWith("/lyrics")) {
              e.preventDefault();
              router.push(`${pathname}/lyrics`);
            }
            return;
          case "t":
            if (pathname.endsWith("/lyrics")) {
              e.preventDefault();
              router.push(pathname.replace("/lyrics", ""));
            }
            return;
        }
      }

      // Start chord
      if (e.key.toLowerCase() === "g") {
        chordRef.current = "g";
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          chordRef.current = null;
        }, 1000);
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (waveSurfer) {
            if (isPlaying) {
              waveSurfer.pause();
              setIsPlaying(false);
            } else {
              waveSurfer.play();
              setIsPlaying(true);
            }
          } else if (pathname.includes("/tracks/")) {
            setTriggerPlayback(true);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (waveSurfer) {
            const seekAmount = e.shiftKey ? 1 : 5;
            const newTime = Math.max(0, waveSurfer.getCurrentTime() - seekAmount);
            waveSurfer.setTime(newTime);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (waveSurfer) {
            const seekAmount = e.shiftKey ? 1 : 5;
            const newTime = Math.min(
              waveSurfer.getDuration(),
              waveSurfer.getCurrentTime() + seekAmount
            );
            waveSurfer.setTime(newTime);
          }
          break;
        case "a":
        case "A":
          e.preventDefault();
          if (pathname === "/projects") {
            setProjectCreateDialogOpen(true);
          } else if (pathname.match(/^\/projects\/[^/]+$/)) {
            setTrackUploadDialogOpen(true);
          } else if (pathname.includes("/tracks/")) {
            setVersionUploadDialogOpen(true);
          }
          break;
        case "?":
          e.preventDefault();
          setShortcutHelpDialogOpen(!isShortcutHelpDialogOpen);
          break;
        case "c":
        case "C":
          if (pathname.includes("/tracks/")) {
            e.preventDefault();
            setFocusCommentInput(true);
          }
          break;
      }
    },
    [
      waveSurfer,
      isPlaying,
      setIsPlaying,
      pathname,
      router,
      setProjectCreateDialogOpen,
      setTrackUploadDialogOpen,
      setVersionUploadDialogOpen,
      isShortcutHelpDialogOpen,
      setShortcutHelpDialogOpen,
      setFocusCommentInput,
      setTriggerPlayback,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
