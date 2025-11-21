import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { initiateMultipartUpload } from "@/lib/storage/s3";
import { initiateMultipartUploadSchema } from "@/lib/validations/track";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";

// POST /api/upload/multipart/initiate - Initiate a multipart upload
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = initiateMultipartUploadSchema.parse(body);

    // Verify user has access to the project
    const { hasAccess } = await checkProjectAccess(
      validatedData.projectId,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = validatedData.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const objectName = `${validatedData.projectId}/${timestamp}-${sanitizedFileName}`;

    // Initiate multipart upload
    const uploadId = await initiateMultipartUpload(
      objectName,
      validatedData.fileType
    );

    return NextResponse.json({
      uploadId,
      objectUrl: objectName,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error initiating multipart upload:", error);
    return NextResponse.json(
      { error: "Failed to initiate multipart upload" },
      { status: 500 }
    );
  }
}
