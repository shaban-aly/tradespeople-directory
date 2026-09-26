"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="3px"
        color="var(--accent)"
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
