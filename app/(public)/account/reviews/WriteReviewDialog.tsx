"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StarRatingInput } from "@/components/ui/star-rating-input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function WriteReviewDialog({ bookingId, propertyName }: { bookingId: string; propertyName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      toast({ title: "Please choose a star rating", variant: "destructive" });
      return;
    }
    if (comment.trim().length < 10) {
      toast({ title: "Please write at least 10 characters", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment: comment.trim() }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          typeof body?.error === "string" ? body.error : (body?.error?.formErrors?.[0] ?? "Failed to submit review");
        toast({ title: message, variant: "destructive" });
        return;
      }

      toast({ title: "Review submitted — it'll show up once approved.", variant: "success" });
      setOpen(false);
      setRating(0);
      setComment("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Write a review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Review your stay at {propertyName}</DialogTitle>

        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Label>Rating</Label>
            <StarRatingInput value={rating} onChange={setRating} className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="review-comment">Your review</Label>
            <Textarea
              id="review-comment"
              className="mt-1.5"
              rows={4}
              maxLength={2000}
              placeholder="Tell other guests about your stay..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={submitting} onClick={handleSubmit}>
            Submit review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
