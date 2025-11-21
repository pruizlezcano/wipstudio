import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { generatePresignedPartUrl } from "@/lib/storage/s3";
import { getChunkUrlsSchema } from "@/lib/validations/track";
import { z } from "zod";
import { checkProjectAccess } from "@/lib/access-control";

// POST /api/upload/multipart/chunk-urls - Get presigned URLs for uploading chunks
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = getChunkUrlsSchema.parse(body);

    // Verify user has access to the project
    const { hasAccess } = await checkProjectAccess(
      validatedData.projectId,
      session.user.id
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Project not found or access denied." }, { status: 404 });
    }

    // Generate presigned URLs for each chunk
    const chunkUrls = await Promise.all(
      validatedData.partNumbers.map(async (partNumber) => {
        const url = await generatePresignedPartUrl(
          validatedData.objectKey,
          validatedData.uploadId,
          partNumber,
          15 * 60 // 15 minutes
        );
        return { partNumber, url };
      })
    );

    return NextResponse.json({ chunkUrls });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error generating chunk URLs:", error);
    return NextResponse.json(
      { error: "Failed to generate chunk URLs" },
      { status: 500 }
    );
  }
}
