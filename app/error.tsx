"use strict";

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-destructive mb-4">Error</h1>
      <h2 className="text-2xl font-semibold mb-6">Something went wrong!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        An unexpected error occurred. We have been notified and are working on a
        fix.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go back home
        </Button>
      </div>
    </main>
  );
}
