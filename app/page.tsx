import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-between py-24 px-8 sm:items-start">
        <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left">
          <h1 className="text-5xl font-bold uppercase leading-none tracking-tighter text-foreground">
            BACKSTAGE
          </h1>
          <p className="max-w-md leading-relaxed text-muted-foreground font-medium">
            Audio collaboration platform for creative professionals. Share
            tracks, manage versions, collect feedback.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-bold sm:flex-row w-full sm:w-auto">
          <Link href="/auth/sign-in">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="outline">
              Sign Up
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
