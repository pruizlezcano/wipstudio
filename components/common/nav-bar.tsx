"use client";

import { NotificationBell } from "@/components/features/notifications/notification-bell";
import Link from "next/link";
import { UserButton } from "@daveyplate/better-auth-ui";

export default function NavBar() {
  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/projects"
          className="font-bold text-lg uppercase tracking-tighter hover:opacity-80 transition-opacity"
        >
          BACKSTAGE
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserButton
            size="sm"
            className="bg-background text-foreground hover:bg-foreground hover:text-background shadow-none"
          />
        </div>
      </div>
    </header>
  );
}
