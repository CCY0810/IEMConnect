"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";

interface UserAvatarProps {
  user?: {
    name?: string;
    avatar_url?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export default function UserAvatar({
  user,
  size = "md",
  className = "",
  showFallback = true,
}: UserAvatarProps) {
  const { user: authUser } = useAuth();
  const displayUser = user || authUser;

  if (!displayUser) {
    return null;
  }

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getAvatarUrl = () => {
    if (displayUser.avatar_url) {
      // If avatar_url is already a full URL (Cloudinary), use it directly
      if (displayUser.avatar_url.startsWith('http')) {
        return displayUser.avatar_url;
      }
      // Fallback for legacy data (just filename) - use API endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      return `${apiUrl}/auth/avatar/${displayUser.avatar_url}`;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={displayUser.name || "User avatar"}
          className="object-cover"
        />
      )}
      {showFallback && (
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
          {getInitials(displayUser.name || "User")}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

