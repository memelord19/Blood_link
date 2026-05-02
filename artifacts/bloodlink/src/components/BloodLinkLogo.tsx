import React from "react";

export function BloodLinkLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 34C20 34 6 24.5 6 15.5C6 10.8 9.8 7 14.5 7C17.1 7 19.4 8.2 20 9.5C20.6 8.2 22.9 7 25.5 7C30.2 7 34 10.8 34 15.5C34 24.5 20 34 20 34Z"
        fill="#C0392B"
        opacity="0.9"
      />
      <path
        d="M20 28C20 28 10 21.5 10 15.5C10 12.5 12.5 10 15.5 10C17.5 10 19.2 11 20 12.3C20.8 11 22.5 10 24.5 10C27.5 10 30 12.5 30 15.5C30 21.5 20 28 20 28Z"
        fill="#922B21"
      />
      <ellipse cx="20" cy="21" rx="3" ry="5" fill="#F1948A" opacity="0.6" transform="rotate(-15 20 21)" />
    </svg>
  );
}
