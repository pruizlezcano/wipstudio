"use client";

import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";
import NavBar from "@/components/common/nav-bar";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { ShortcutHelpDialog } from "@/components/features/shortcuts/shortcut-help-dialog";
import { useUIStore } from "@/stores/uiStore";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useShortcuts();
  const { isShortcutHelpDialogOpen, setShortcutHelpDialogOpen } = useUIStore();

  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1">{children}</main>
        </div>
        <ShortcutHelpDialog
          open={isShortcutHelpDialogOpen}
          onOpenChange={setShortcutHelpDialogOpen}
        />
      </SignedIn>
    </>
  );
}
