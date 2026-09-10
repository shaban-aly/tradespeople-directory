"use client";

import { useGoogleOneTap } from "@/hooks/auth/useGoogleOneTap";

interface GoogleOneTapProps {
  redirectTo?: string;
  disabled?: boolean;
}

export function GoogleOneTap({ redirectTo, disabled }: GoogleOneTapProps) {
  useGoogleOneTap({ redirectTo, disabled });
  return null;
}
