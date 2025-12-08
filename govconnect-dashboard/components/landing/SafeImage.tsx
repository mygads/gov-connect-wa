"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

/**
 * SafeImage Component
 * Image component with error handling and fallback
 */

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallback?: React.ReactNode;
  onErrorCallback?: () => void;
}

export const SafeImage = ({
  fallback,
  onErrorCallback,
  alt,
  ...props
}: SafeImageProps) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
    if (onErrorCallback) {
      onErrorCallback();
    }
    if (process.env.NODE_ENV === "development") {
      console.warn(`Failed to load image: ${props.src}`);
    }
  };

  if (error && fallback) {
    return <>{fallback}</>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg p-4">
        <span className="text-sm text-muted-foreground">{alt}</span>
      </div>
    );
  }

  return <Image {...props} alt={alt} onError={handleError} />;
};
