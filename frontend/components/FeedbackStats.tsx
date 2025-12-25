"use client";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Star, MessageSquare, TrendingUp } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";

interface FeedbackStatsProps {
  averageRating: number;
  totalFeedback: number;
  ratingDistribution: Record<string, number>;
  recentFeedback?: Array<{
    id: number;
    user_name: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }>;
  loading?: boolean;
}

const RATING_COLORS = {
  '5': '#22c55e', // green
  '4': '#84cc16', // lime  
  '3': '#eab308', // yellow
  '2': '#f97316', // orange
  '1': '#ef4444', // red
};

/**
 * FeedbackStats Component
 * Displays feedback analytics: average rating, distribution chart, and recent comments
 */
export default function FeedbackStats({
  averageRating,
  totalFeedback,
  ratingDistribution,
  recentFeedback = [],
  loading = false,
}: FeedbackStatsProps) {
  // Prepare chart data
  const chartData = [5, 4, 3, 2, 1].map((rating) => ({
    rating: `${rating}★`,
    count: ratingDistribution[String(rating)] || 0,
    ratingNum: rating,
  }));

  // Render stars for rating display
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
        <CardHeader>
          <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-slate-700 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Rating Card + Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Satisfaction Score Card */}
        <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-purple-900/40 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Star className="w-4 h-4 text-yellow-400" />
              Satisfaction Score
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Based on {totalFeedback} reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-yellow-300">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-2xl text-slate-400">/5.0</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-600"
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution Chart */}
        <Card className="lg:col-span-2 bg-slate-800 border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Rating Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Breakdown of all ratings received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis 
                    dataKey="rating" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={12}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    formatter={(value: number) => [`${value} reviews`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={RATING_COLORS[String(entry.ratingNum) as keyof typeof RATING_COLORS]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback Section */}
      {recentFeedback.length > 0 && (
        <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Recent Comments
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Latest feedback from attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {recentFeedback.slice(0, 5).map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {feedback.user_name}
                      </span>
                      {renderStars(feedback.rating)}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDateDDMMYYYY(feedback.created_at)}
                    </span>
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-slate-300 line-clamp-2">
                      "{feedback.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
