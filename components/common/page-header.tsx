import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-12 flex-col sm:flex-row gap-6 sm:gap-0">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tighter mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-xs font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
