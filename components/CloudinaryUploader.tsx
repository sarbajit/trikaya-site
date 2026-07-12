"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Upload, X, FileText } from "lucide-react";
import type { UploadFolder } from "@/lib/uploadFolders";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CloudinaryUploaderProps {
  folder: UploadFolder;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  resourceType?: "image" | "auto";
}

export function CloudinaryUploader({
  folder,
  value,
  onChange,
  label,
  accept = "image/*",
  resourceType = "image",
}: CloudinaryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const signResponse = await fetch("/api/uploads/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      if (!signResponse.ok) throw new Error("Could not get upload signature");
      const { timestamp, signature, apiKey, cloudName } = await signResponse.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadResponse.ok) throw new Error("Upload failed");
      const uploaded = await uploadResponse.json();
      onChange(uploaded.secure_url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-3">
        {value && resourceType === "image" && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-input">
            <Image src={value} alt={label ?? "Uploaded image"} fill className="object-cover" />
          </div>
        )}
        {value && resourceType === "auto" && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-input px-2 py-1.5 text-sm text-foreground underline"
          >
            <FileText className="size-4 shrink-0" />
            View uploaded file
          </a>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {isUploading ? "Uploading..." : value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            <X />
            Remove
          </Button>
        )}
      </div>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
