"use client";

import React from "react";

import { signIn } from "next-auth/react";

import { cn } from "@/lib/utils";

interface AuthButtonProps {
  provider: string;
  icon: React.ReactNode;
  text: string;
  className?: string;
  callbackUrl?: string;
}

export function AuthButton({ provider, icon, text, className, callbackUrl = "/" }: AuthButtonProps) {
  return (
    <button
      onClick={() => signIn(provider, { callbackUrl })}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:outline-none",
        className
      )}
    >
      {icon}
      {text}
    </button>
  );
}
