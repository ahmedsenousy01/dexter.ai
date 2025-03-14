import React from "react";

import { Layers } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-orange-100 to-blue-200" />
      <div className="z-10 w-full max-w-md px-4">
        <div className="mb-6 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="rounded-full bg-white/90 p-2 shadow-md">
            <Layers className="h-8 w-8 text-pink-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dexter AI</h1>
          <p className="text-gray-600">Your AI-Powered Collaborative Document Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
