import { v2 as cloudinary } from "cloudinary";

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function createSignedUploadParams(folder: string): SignedUploadParams {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

  return { timestamp, signature, apiKey, cloudName, folder };
}
