import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href: string;
  label?: string;
}

export function BackButton({ href, label = "Back" }: BackButtonProps) {
  return (
    <Button variant="outline" asChild className="mb-4">
      <Link href={href}>← {label}</Link>
    </Button>
  );
}
