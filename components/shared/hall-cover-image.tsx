"use client";

import { useState } from "react";

const DEFAULT_HALL_IMAGE_SRC = "/default-hall.svg";

type HallCoverImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
};

export function HallCoverImage({ src, alt, className }: HallCoverImageProps) {
  const normalizedSrc = src?.trim() ?? "";

  return (
    <HallCoverImageInner
      key={normalizedSrc || DEFAULT_HALL_IMAGE_SRC}
      src={normalizedSrc}
      alt={alt}
      className={className}
    />
  );
}

type HallCoverImageInnerProps = {
  src: string;
  alt: string;
  className?: string;
};

function HallCoverImageInner({ src, alt, className }: HallCoverImageInnerProps) {
  const [hasError, setHasError] = useState(false);
  const currentSrc = !hasError && src.length > 0 ? src : DEFAULT_HALL_IMAGE_SRC;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
    />
  );
}
