import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /**
   * Size variant for the spinner
   * - 'xs': 16px (size-4) - For small buttons and icons
   * - 'sm': 24px (size-6) - For inline sections
   * - 'md': 48px (size-12) - For components (default)
   * - 'lg': Full page with text
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Optional text to display below spinner (only shown for 'lg' size)
   */
  text?: string;
  /**
   * Additional CSS classes for the spinner container
   */
  className?: string;
}

export function LoadingSpinner({
  size = "lg",
  text = "WIPStudio",
  className,
}: LoadingSpinnerProps) {
  // Size-specific styles
  const sizeClasses = {
    xs: "size-4",
    sm: "size-6",
    md: "size-12",
    lg: "size-12",
  };

  // For full-page variant (lg)
  if (size === "lg") {
    return (
      <div
        className={cn(
          "container mx-auto py-12 flex flex-col items-center justify-center gap-4 min-h-screen",
          className
        )}
      >
        <div
          className={cn(
            sizeClasses.lg,
            "border border-foreground/50 animate-spin"
          )}
        />
        {text && (
          <h1 className="text-2xl font-bold tracking-tighter mb-2">{text}</h1>
        )}
      </div>
    );
  }

  // For inline variants (xs, sm, md)
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          sizeClasses[size],
          "border border-foreground/50 animate-spin"
        )}
      />
    </div>
  );
}
