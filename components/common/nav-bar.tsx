"use client";

import { NotificationBell } from "@/components/features/notifications/notification-bell";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@daveyplate/better-auth-ui";

export default function NavBar() {
  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link
          href="/projects"
          className="font-bold text-lg sm:text-2xl tracking-tighter hover:opacity-80 transition-opacity"
        >
          <div className="flex flex-row gap-1.5 sm:gap-2 items-center">
            <Image
              src="/icon0.svg"
              alt="WIPStudio Logo"
              width={32}
              height={32}
              className="sm:w-10 sm:h-10"
            />
            <span className="hidden xs:inline sm:inline">WIPStudio</span>
          </div>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
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
