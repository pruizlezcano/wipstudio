import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { abortMultipartUpload } from "@/lib/storage/s3";
import { abortMultipartUploadSchema } from "@/lib/validations/track";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";

// POST /api/upload/multipart/abort - Abort a multipart upload
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = abortMultipartUploadSchema.parse(body);

    // Verify user has access to the project
    const { hasAccess } = await checkProjectAccess(
      validatedData.projectId,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    // Abort the multipart upload
    await abortMultipartUpload(
      validatedData.objectKey,
      validatedData.uploadId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error aborting multipart upload:", error);
    return NextResponse.json(
      { error: "Failed to abort multipart upload" },
      { status: 500 }
    );
  }
}
