import React from "react";
import { cn } from "@/lib/utils";

const BLOOD_TYPE_COLORS: Record<string, string> = {
  "A+": "bg-red-600 text-white",
  "A-": "bg-red-300 text-red-900",
  "B+": "bg-blue-600 text-white",
  "B-": "bg-blue-300 text-blue-900",
  "AB+": "bg-purple-600 text-white",
  "AB-": "bg-purple-300 text-purple-900",
  "O+": "bg-green-600 text-white",
  "O-": "bg-green-300 text-green-900",
};

export function BloodTypeBadge({
  type,
  bloodType,
  size = "md",
}: {
  type?: string;
  bloodType?: string;
  size?: "sm" | "md" | "lg";
}) {
  const value = bloodType || type || "";
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm font-bold",
    lg: "w-16 h-16 text-lg font-bold",
  };
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0",
        BLOOD_TYPE_COLORS[value] || "bg-gray-200 text-gray-700",
        sizes[size]
      )}
    >
      {value}
    </div>
  );
}
