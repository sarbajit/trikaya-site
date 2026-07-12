"use client";

import { X } from "lucide-react";
import type { UploadFolder } from "@/lib/uploadFolders";
import { CloudinaryUploader } from "@/components/CloudinaryUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GalleryImage {
  url: string;
  alt: string;
}

interface ImageGalleryUploaderProps {
  folder: UploadFolder;
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  label?: string;
}

export function ImageGalleryUploader({ folder, images, onChange, label }: ImageGalleryUploaderProps) {
  function updateImage(index: number, patch: Partial<GalleryImage>) {
    onChange(images.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function addImage(url: string) {
    onChange([...images, { url, alt: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {label && <Label>{label}</Label>}
      <div className="flex flex-col gap-3">
        {images.map((image, index) => (
          <div key={index} className="flex items-start gap-3 rounded-md border border-input p-3">
            <CloudinaryUploader
              folder={folder}
              value={image.url}
              onChange={(url) => updateImage(index, { url })}
            />
            <Input
              placeholder="Alt text (required)"
              value={image.alt}
              onChange={(e) => updateImage(index, { alt: e.target.value })}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
              <X />
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-dashed border-input p-3">
        <CloudinaryUploader folder={folder} value="" onChange={addImage} label="Add image" />
      </div>
    </div>
  );
}
