"use client";

import { Button } from "@/components/ui/button";

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

/**
 * QuickActionButton Component
 * Reusable full-width action button used in dashboards.
 * 
 * @param icon - React node for the button icon
 * @param label - Button label text
 * @param onClick - Click handler
 * @param variant - 'primary' (indigo) or 'secondary' (slate outline)
 */
export default function QuickActionButton({
  icon,
  label,
  onClick,
  variant = "secondary",
}: QuickActionButtonProps) {
  const isPrimary = variant === "primary";

  const classes = isPrimary
    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
    : "bg-slate-800 text-slate-300 border border-slate-600 hover:bg-indigo-900 hover:text-indigo-400 hover:border-indigo-500 transition-all shadow-sm";

  return (
    <Button
      variant="outline"
      className={`w-full justify-start font-semibold rounded-lg ${classes}`}
      onClick={onClick}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </Button>
  );
}
