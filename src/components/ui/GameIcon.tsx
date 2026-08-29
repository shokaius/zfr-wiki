import { useState } from "react";
import { iconUrl, genericZombieIcon } from "../../lib/assets";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const SIZE_PX: Record<Size, number> = { xs: 16, sm: 20, md: 32, lg: 48, xl: 72 };

export function GameIcon({
  file,
  alt,
  size = "md",
  fallback = "zombie",
  className = "",
}: {
  file: string | null | undefined;
  alt: string;
  size?: Size;
  fallback?: "zombie" | "none";
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const px = SIZE_PX[size];
  const src = iconUrl(file);

  if (!src || errored) {
    if (fallback === "zombie") {
      return (
        <img
          src={genericZombieIcon()}
          alt={alt}
          width={px}
          height={px}
          className={`inline-block shrink-0 object-contain opacity-50 ${className}`}
          loading="lazy"
        />
      );
    }
    return (
      <span
        aria-label={alt}
        style={{ width: px, height: px }}
        className={`inline-flex shrink-0 items-center justify-center rounded bg-surface-2 text-[10px] text-muted ${className}`}
      >
        ?
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={px}
      height={px}
      onError={() => setErrored(true)}
      className={`inline-block shrink-0 object-contain ${className}`}
      loading="lazy"
    />
  );
}
