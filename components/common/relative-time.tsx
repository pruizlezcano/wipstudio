"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";

interface RelativeTimeProps {
  date: Date | string;
  addSuffix?: boolean;
}

export function RelativeTime({ date, addSuffix = true }: RelativeTimeProps) {
  const [, setTick] = useState(true);

  useEffect(() => {
    // Update every second to refresh the relative time display
    const interval = setInterval(() => {
      setTick((prev) => !prev);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {formatDistanceToNowStrict(new Date(date), {
        addSuffix,
      })}
    </>
  );
}
