import { NextResponse } from "next/server";
import { getHealthReport } from "@/lib/health";

export const runtime = "nodejs";

export async function GET() {
  const report = await getHealthReport();
  const status = report.status === "failed" ? 503 : 200;

  return NextResponse.json(report, { status });
}
