"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

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

  // تصفير حالة الخطأ عند تغيّر المصدر أثناء الريندر (النمط الرسمي من React)
  // بدل useEffect — يمنع ريندر متتالٍ ووميضاً للصورة البديلة عند تغيير الصورة.
  const srcKey = String(src);
  const [lastSrcKey, setLastSrcKey] = useState(srcKey);
  if (lastSrcKey !== srcKey) {
    setLastSrcKey(srcKey);
    setError(false);
  }

  if (error || !src) {
    // Fallback: img عادية بدون next/image optimization
    // لأن الصورة البديلة محلية ولا تحتاج optimization، ولأن كل طلب يُحسب كـ optimization
    return (
      // eslint-disable-next-line @next/next/no-img-element
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
      key={srcKey}
      {...rest}
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}
