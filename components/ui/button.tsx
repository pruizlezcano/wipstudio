import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-tight transition-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary hover:bg-primary-foreground hover:text-primary hover:border-primary",
        destructive:
          "bg-destructive text-white border-destructive hover:bg-white hover:text-destructive hover:border-destructive",
        outline:
          "border-foreground bg-inherit hover:bg-foreground hover:text-background",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary hover:bg-foreground hover:text-background hover:border-foreground",
        ghost: "border-transparent hover:border-foreground hover:bg-foreground",
        link: "border-transparent text-foreground underline-offset-4 hover:underline uppercase",
        accent:
          "bg-accent text-accent-foreground border-accent hover:bg-foreground hover:text-background hover:border-foreground",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-8 has-[>svg]:px-6",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
