"use client";

import { useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";

export function PrivacyActions() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await fetch("/api/account/data-export");
      if (!response.ok) {
        toast({ title: "Failed to export data", variant: "destructive" });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "trikaya-data-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeletionRequest() {
    setIsRequesting(true);
    try {
      const response = await fetch("/api/account/data-deletion-request", { method: "POST" });
      if (!response.ok) {
        toast({ title: "Failed to submit request", variant: "destructive" });
        return;
      }
      setRequested(true);
      toast({ title: "Deletion request submitted.", variant: "success" });
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-4 text-primary" /> Download your data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Get a copy of your profile, bookings, reviews, and consent history as a JSON file.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Preparing..." : "Download my data"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="size-4 text-destructive" /> Delete your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Request account deletion. Our team will anonymize your profile — booking and invoice records are kept
            (anonymized) as required for tax and legal purposes, per our{" "}
            <a href="/privacy-policy" className="underline hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
          {requested ? (
            <p className="mt-3 text-sm font-medium text-foreground">
              Request submitted — our team will process this shortly.
            </p>
          ) : (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="destructive" size="sm" className="mt-3" disabled={isRequesting}>
                  Request account deletion
                </Button>
              }
              title="Request account deletion?"
              description="This notifies our team to anonymize your profile. Your bookings and invoices are retained (anonymized) for legal record-keeping — this action can't be undone once processed."
              confirmLabel="Request deletion"
              onConfirm={handleDeletionRequest}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
