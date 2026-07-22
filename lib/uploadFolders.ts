export const UPLOAD_FOLDERS = ["logos", "branding", "properties", "rooms", "agents", "reviews"] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
