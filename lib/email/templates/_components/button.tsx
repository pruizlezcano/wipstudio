import { Button } from "@react-email/components";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "#0a0a0a",
        border: "1px solid #0a0a0a",
        borderRadius: "0",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "500",
        textDecoration: "none",
        textAlign: "center" as const,
        display: "inline-block",
        padding: "10px 24px",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </Button>
  );
}
