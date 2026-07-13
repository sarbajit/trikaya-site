"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  loginEnabled: boolean;
}

const DEFAULT_FORM: CustomerFormData = {
  name: "",
  email: "",
  phone: "",
  role: "customer",
  loginEnabled: true,
};

export function CustomerForm({
  mode,
  customerId,
  initialData,
}: {
  mode: "create" | "edit";
  customerId?: string;
  initialData?: CustomerFormData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<CustomerFormData>(initialData ?? DEFAULT_FORM);
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  function update<K extends keyof CustomerFormData>(key: K, value: CustomerFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setErrors(null);

    const url = mode === "create" ? "/api/admin/customers" : `/api/admin/customers/${customerId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          password: password || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrors(body?.error?.fieldErrors ?? null);
        toast({
          title: body?.error?.fieldErrors?.password?.[0] ?? body?.error?.formErrors?.[0] ?? "Failed to save customer",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      toast({ title: mode === "create" ? "Customer created." : "Customer updated.", variant: "success" });
      if (mode === "create") {
        router.push(`/admin/customers/${data.id}/edit`);
      } else {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Name" htmlFor="name" error={errors?.name} required>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors?.email} required>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={errors?.phone}>
            <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </FormField>
          <FormField label="Role" htmlFor="role" error={errors?.role} required>
            <Select value={form.role} onValueChange={(v) => update("role", v as CustomerFormData["role"])}>
              <SelectTrigger id="role" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Switch
              id="loginEnabled"
              checked={form.loginEnabled}
              onCheckedChange={(checked) => update("loginEnabled", checked)}
            />
            <Label htmlFor="loginEnabled">Login enabled</Label>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            When disabled, this account cannot sign in even if a password is set — useful for guests who only
            transact offline.
          </p>
          <FormField
            label={mode === "create" ? "Password" : "New password"}
            htmlFor="password"
            error={errors?.password}
            hint={mode === "edit" ? "Leave blank to keep the current password." : undefined}
            required={mode === "create" && form.loginEnabled}
            className="mt-4"
          >
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? "Saving..." : mode === "create" ? "Create customer" : "Save changes"}
      </Button>
    </form>
  );
}
