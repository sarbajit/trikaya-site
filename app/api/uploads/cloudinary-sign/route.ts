import { NextResponse } from "next/server";
import { z } from "zod";
import { createSignedUploadParams } from "@/lib/cloudinary";
import { UPLOAD_FOLDERS } from "@/lib/uploadFolders";

const bodySchema = z.object({
  folder: z.enum(UPLOAD_FOLDERS),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const params = createSignedUploadParams(parsed.data.folder);
    return NextResponse.json(params);
  } catch (error) {
    console.error("Failed to create Cloudinary signature", error);
    return NextResponse.json({ error: "Upload signing is not configured" }, { status: 500 });
  }
}
