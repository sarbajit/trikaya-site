"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DynamicListFieldProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  inputType?: string;
}

export function DynamicListField({
  label,
  items,
  onChange,
  placeholder,
  inputType = "text",
}: DynamicListFieldProps) {
  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {items.length === 0 && <p className="text-xs text-muted-foreground">None added yet.</p>}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            type={inputType}
            value={item}
            placeholder={placeholder}
            onChange={(e) => updateItem(index, e.target.value)}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addItem}>
        <Plus />
        Add
      </Button>
    </div>
  );
}
