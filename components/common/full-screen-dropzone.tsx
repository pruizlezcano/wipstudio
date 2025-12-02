"use client";

import { useCallback, useState, useImperativeHandle, forwardRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface FullScreenDropzoneProps {
  children: React.ReactNode;
  onFileDrop: (file: File) => void;
  message?: string;
  accept?: Record<string, string[]>;
}

export interface FullScreenDropzoneRef {
  openFilePicker: () => void;
}

export const FullScreenDropzone = forwardRef<
  FullScreenDropzoneRef,
  FullScreenDropzoneProps
>(function FullScreenDropzone(
  {
    children,
    onFileDrop,
    message = "Drop your audio file here",
    accept = {
      "audio/*": [
        ".mp3",
        ".wav",
        ".wave",
        ".aiff",
        ".aif",
        ".flac",
        ".ogg",
        ".oga",
        ".aac",
        ".m4a",
        ".mp4",
        ".webm",
        ".opus",
        ".wma",
      ],
    },
  },
  ref
) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setIsDraggingOver(false);
      if (acceptedFiles.length > 0) {
        onFileDrop(acceptedFiles[0]);
      }
    },
    [onFileDrop]
  );

  const onDragEnter = useCallback(() => {
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  // Expose the open function via ref
  useImperativeHandle(ref, () => ({
    openFilePicker: open,
  }));

  const showOverlay = isDragActive || isDraggingOver;

  return (
    <div {...getRootProps()} className="relative min-h-screen">
      <input {...getInputProps()} />
      {children}

      {/* Full-screen overlay when dragging */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="bg-input p-8 animate-bounce">
              <Upload className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{message}</h2>
              <p className="text-muted-foreground text-sm">
                Release to upload your file
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
