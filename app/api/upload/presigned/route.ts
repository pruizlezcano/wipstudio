import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { generatePresignedPutUrl } from "@/lib/storage/s3";
import { uploadRequestSchema } from "@/lib/validations/track";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";
import { nanoid } from "nanoid";
import { getFileExtension } from "@/lib/utils";

// POST /api/upload/presigned - Generate presigned URL for file upload
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = uploadRequestSchema.parse(body);

    // Verify user owns the project
    const { hasAccess } = await checkProjectAccess(
      validatedData.projectId,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    // Generate unique file name using ID-based approach with organized structure
    const versionId = nanoid();
    const fileExtension = getFileExtension(validatedData.fileName);
    const objectName = `${validatedData.projectId}/tracks/${versionId}${fileExtension}`;

    // Generate presigned URL for upload (valid for 15 minutes)
    const uploadUrl = await generatePresignedPutUrl(
      objectName,
      15 * 60, // 15 minutes in seconds
      validatedData.fileType
    );

    // Return the object key as objectUrl (we'll generate presigned URLs when retrieving)
    // This way we can regenerate fresh presigned URLs that don't expire
    return NextResponse.json({
      uploadUrl,
      objectUrl: objectName, // Store the object key, not a presigned URL
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
