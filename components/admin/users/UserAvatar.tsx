"use client";

import { useState } from "react";
import Image from "next/image";
import { IconUser } from "@/components/shared/icons";

interface UserAvatarProps {
  url: string | null;
  name: string;
  size?: number;
}

export function UserAvatar({ url, name, size = 40 }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-accent/10 font-bold text-accent"
        style={{ width: size, height: size }}
      >
        {name.charAt(0) || <IconUser className="h-5 w-5" />}
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-border"
      style={{ width: size, height: size }}
    >
      <Image
        src={url}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
