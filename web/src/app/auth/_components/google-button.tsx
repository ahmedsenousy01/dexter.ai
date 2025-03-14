import React from "react";

import { FcGoogle } from "react-icons/fc";

import { AuthButton } from "./auth-button";

interface GoogleButtonProps {
  callbackUrl?: string;
}

export function GoogleButton({ callbackUrl }: GoogleButtonProps) {
  return (
    <AuthButton
      provider="google"
      icon={<FcGoogle className="mr-2 h-5 w-5" />}
      text="Continue with Google"
      className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      callbackUrl={callbackUrl}
    />
  );
}
