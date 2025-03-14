import React from "react";

import { FaGithub } from "react-icons/fa";

import { AuthButton } from "./auth-button";

interface GithubButtonProps {
  callbackUrl?: string;
}

export function GithubButton({ callbackUrl }: GithubButtonProps) {
  return (
    <AuthButton
      provider="github"
      icon={<FaGithub className="mr-2 h-5 w-5" />}
      text="Continue with GitHub"
      className="bg-[#24292e] text-white hover:bg-[#2c3136]"
      callbackUrl={callbackUrl}
    />
  );
}
