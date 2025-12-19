"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitFeedback } from "@/lib/feedback-api";
import { Star, Loader2, CheckCircle, X } from "lucide-react";

interface FeedbackFormProps {
  eventId: number;
  eventTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * FeedbackForm Component
 * A modal/card form for submitting event feedback with star rating and optional comment.
 */
export default function FeedbackForm({
  eventId,
  eventTitle,
  onClose,
  onSuccess,
}: FeedbackFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        event_id: eventId,
        rating,
        comment: comment.trim() || undefined,
      });

      setSubmitted(true);
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });

      // Call onSuccess after a short delay to show success state
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description:
          error.response?.data?.error || "Failed to submit feedback.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (value: number): string => {
    switch (value) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Select a rating";
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardContent className="py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-900/50 rounded-full p-4 border border-green-700">
              <CheckCircle size={48} className="text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-400 mb-2">
            Thank You!
          </h3>
          <p className="text-slate-400">
            Your feedback has been submitted successfully.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <X size={20} />
        </Button>
        <CardTitle className="text-xl text-white">Share Your Feedback</CardTitle>
        <CardDescription className="text-slate-400">
          How was your experience at <span className="text-indigo-400 font-medium">{eventTitle}</span>?
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">
            Your Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  size={32}
                  className={`transition-colors ${
                    value <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400">
            {getRatingLabel(hoveredRating || rating)}
          </p>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label
            htmlFor="feedback-comment"
            className="text-sm font-medium text-slate-300"
          >
            Additional Comments <span className="text-slate-500">(Optional)</span>
          </label>
          <Textarea
            id="feedback-comment"
            placeholder="Tell us about your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 resize-none"
          />
          <p className="text-xs text-slate-500 text-right">
            {comment.length}/2000 characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
