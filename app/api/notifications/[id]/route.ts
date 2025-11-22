import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db/db";
import { notification } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/notifications/[id] - Mark single notification as read
export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Update only if the notification belongs to the current user
        const result = await db
            .update(notification)
            .set({ readAt: new Date() })
            .where(
                and(
                    eq(notification.id, id),
                    eq(notification.userId, session.user.id)
                )
            )
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return NextResponse.json(
            { error: "Failed to mark notification as read" },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications/[id] - Delete single notification
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Delete only if the notification belongs to the current user
        const result = await db
            .delete(notification)
            .where(
                and(
                    eq(notification.id, id),
                    eq(notification.userId, session.user.id)
                )
            )
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json(
            { error: "Failed to delete notification" },
            { status: 500 }
        );
    }
}
