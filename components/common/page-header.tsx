import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 sm:mb-12 flex-col sm:flex-row gap-4 sm:gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tighter mb-1 sm:mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-xs font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}
