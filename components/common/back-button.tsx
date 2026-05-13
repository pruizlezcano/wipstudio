import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { MouseEventHandler } from "react";

interface BackButtonProps {
  href: string;
  label?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function BackButton({ href, label = "Back", onClick }: BackButtonProps) {
  return (
    <Button variant="outline" asChild className="mb-4">
      <Link href={href} onClick={onClick}>
        ← {label}
      </Link>
    </Button>
  );
}
