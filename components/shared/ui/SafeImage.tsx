"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface SafeImageProps extends ImageProps {
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  fallbackSrc = "/favicon-96x96.png",
  alt,
  ...rest
}: SafeImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <Image
      {...rest}
      src={error || !src ? fallbackSrc : src}
      alt={alt}
      onError={() => setError(true)}
    />
  );
}
