"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DateTimeMode = "relative" | "date" | "datetime" | "time";

interface DateTimeProps {
  date: Date | string | number | null | undefined;
  mode?: DateTimeMode;
  addSuffix?: boolean;
  className?: string;
  tooltipClassName?: string;
  fallback?: string;
}

const RELATIVE_REFRESH_MS = 1_000;

function formatDisplayDate(
  value: Date,
  mode: DateTimeMode,
  addSuffix: boolean = false
) {
  switch (mode) {
    case "relative":
      return formatDistanceToNowStrict(value, { addSuffix });
    case "date":
      return format(value, "dd/MM/yyyy");
    case "datetime":
      return format(value, "dd/MM/yyyy HH:mm:ss");
    case "time":
      return format(value, "HH:mm");
    default:
      return format(value, "dd/MM/yyyy");
  }
}

export function DateTime({
  date,
  mode = "relative",
  addSuffix = true,
  className,
  tooltipClassName,
  fallback = "—",
}: DateTimeProps) {
  const [_, setTick] = useState(0);

  useEffect(() => {
    if (mode !== "relative") return;

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, RELATIVE_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [mode]);

  const parsedDate = useMemo(() => {
    if (!date) return null;

    const value = new Date(date);
    return Number.isNaN(value.getTime()) ? null : value;
  }, [date]);

  if (!parsedDate) {
    return <>{fallback}</>;
  }

  const displayValue = formatDisplayDate(parsedDate, mode, addSuffix);
  const tooltipValue = formatDisplayDate(parsedDate, "datetime");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex", className)}>{displayValue}</span>
      </TooltipTrigger>
      <TooltipContent className={tooltipClassName}>
        {tooltipValue}
      </TooltipContent>
    </Tooltip>
  );
}
