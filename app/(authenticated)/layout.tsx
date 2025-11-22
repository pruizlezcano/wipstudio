import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RedirectToSignIn />
      <SignedIn>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
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
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </SignedIn>
    </>
  );
}
