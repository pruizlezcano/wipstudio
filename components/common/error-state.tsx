import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  variant?: "full" | "inline";
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while fetching data.",
  actionLabel,
  onAction,
  href,
  variant = "full",
}: ErrorStateProps) {
  const content = (
    <>
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
      {(onAction || href) && (
        <div className="flex gap-4 justify-center">
          {onAction && <Button onClick={onAction}>{actionLabel || "Try again"}</Button>}
          {href && (
            <Button variant="outline" asChild>
              <Link href={href}>{actionLabel || "Return Home"}</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <div className="py-12 text-center border rounded-lg bg-muted/20">
        {content}
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <TriangleAlert className="size-24 text-destructive/80 mb-4"/>
      {content}
    </main>
  );
}
