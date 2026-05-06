import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "../../ui/kbd";

interface ShortcutHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutHelpDialog({
  open,
  onOpenChange,
}: ShortcutHelpDialogProps) {
  const sections = [
    {
      title: "Playback",
      shortcuts: [
        { keys: ["Space"], description: "Play / Pause" },
        { keys: ["←", "→"], description: "Seek 5s" },
        { keys: ["Shift", "←", "→"], description: "Micro-seek 1s" },
        { keys: ["Esc"], description: "Blur focus (exit input)" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["g", "h"], description: "Go Home (Projects)" },
        { keys: ["g", "p"], description: "Go to Project page" },
        { keys: ["g", "l"], description: "Go to Lyrics" },
        { keys: ["g", "t"], description: "Go to Track" },
      ],
    },
    {
      title: "Actions",
      shortcuts: [
        { keys: ["a"], description: "Add New (Project/Track/Version)" },
        { keys: ["c"], description: "Focus Comment Box (at current time)" },
        { keys: ["⌘", "Enter"], description: "Post Comment / Save Edit" },
      ],
    },
    {
        title: "General",
        shortcuts: [
          { keys: ["?"], description: "Show this help" },
        ],
      },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h4>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
