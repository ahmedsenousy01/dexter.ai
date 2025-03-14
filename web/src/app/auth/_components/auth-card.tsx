import React from "react";

import Link from "next/link";

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white/90 shadow-xl backdrop-blur-sm">
      <div className="p-6">
        <div className="space-y-4">
          <h2 className="text-center text-xl font-semibold text-gray-900">{title}</h2>
          {children}
        </div>
        <div className="mt-6">
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By continuing, you agree to Dexter AI{"'"}s{" "}
              <Link
                href="/info/terms-of-service"
                className="font-medium text-pink-600 hover:text-pink-500"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/info/privacy-policy"
                className="font-medium text-pink-600 hover:text-pink-500"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
