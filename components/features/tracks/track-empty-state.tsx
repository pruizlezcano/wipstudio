import { Card, CardContent } from "@/components/ui/card";

export function TrackEmptyState() {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-muted-foreground mb-4 uppercase text-xs font-bold tracking-tight">
          No tracks yet. Upload your first track to get started.
        </p>
      </CardContent>
    </Card>
  );
}
