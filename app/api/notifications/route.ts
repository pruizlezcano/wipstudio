import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { notification } from "@/lib/db/schema";
import { eq, isNull, desc, and } from "drizzle-orm";

// GET /api/notifications - List user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db
      .select()
      .from(notification)
      .where(eq(notification.userId, session.user.id))
      .orderBy(desc(notification.createdAt))
      .limit(limit)
      .offset(offset);

    // Filter for unread notifications if requested
    if (unreadOnly) {
      query = db
        .select()
        .from(notification)
        .where(
          and(
            eq(notification.userId, session.user.id),
            isNull(notification.readAt)
          )
        )
        .orderBy(desc(notification.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const notifications = await query;

    // Parse metadata JSON for each notification
    const parsedNotifications = notifications.map((n) => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }));

    return NextResponse.json(parsedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark all notifications as read
export async function PATCH(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(notification)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notification.userId, session.user.id),
          isNull(notification.readAt)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
