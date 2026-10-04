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
  className,
  style,
  ...rest
}: SafeImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (error || !src) {
    // Fallback: img عادية بدون next/image optimization
    // لأن الصورة البديلة محلية ولا تحتاج optimization، ولأن كل طلب يُحسب كـ optimization
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={fallbackSrc}
        alt={alt as string || ""}
        className={className}
        style={style}
        aria-hidden={!alt ? true : undefined}
      />
    );
  }

  return (
    <Image
      key={String(src)}
      {...rest}
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}
