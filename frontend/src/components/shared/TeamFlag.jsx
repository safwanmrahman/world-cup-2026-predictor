import { useEffect, useState } from "react";
import { CODE_TO_ISO } from "../../data/constants";

const FLAG_DIMENSIONS = {
  sm: { width: 24, height: 18, fallbackHeight: 36 },
  md: { width: 32, height: 24, fallbackHeight: 48 },
  lg: { width: 64, height: 48, fallbackHeight: 96 },
  hero: { width: 80, height: 60, fallbackHeight: 120 },
  xl: { width: 96, height: 72, fallbackHeight: 144 },
};

export default function TeamFlag({ code, size = "sm", alt }) {
  const iso = CODE_TO_ISO[code];
  const [src, setSrc] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  const dimensions = FLAG_DIMENSIONS[size] ?? FLAG_DIMENSIONS.sm;
  const primarySrc = iso ? `https://flagcdn.com/${iso}.svg` : null;
  const fallbackSrc = iso ? `https://flagcdn.com/h${dimensions.fallbackHeight}/${iso}.png` : null;

  useEffect(() => {
    setSrc(null);
    setAspectRatio(null);
  }, [primarySrc]);

  const resolvedAspectRatio = aspectRatio ?? (dimensions.width / dimensions.height);
  const resolvedWidth = Math.max(dimensions.width, Math.round(dimensions.height * resolvedAspectRatio));
  const flagShellStyle = {
    "--flag-width": `${resolvedWidth}px`,
    "--flag-height": `${dimensions.height}px`,
  };

  if (!iso) {
    return (
      <span
        className={`flag-shell flag-${size}`}
        style={flagShellStyle}
        aria-hidden="true"
      />
    );
  }

  if (src === "") {
    return (
      <span
        className={`flag-shell flag-code-fallback flag-${size}`}
        style={flagShellStyle}
      >
        {code}
      </span>
    );
  }

  return (
    <span
      className={`flag-shell flag-${size}`}
      style={flagShellStyle}
    >
      <img
        src={src ?? primarySrc}
        alt={alt ?? `${code} flag`}
        className="flag-image"
        height={dimensions.height}
        loading="lazy"
        decoding="async"
        draggable="false"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth && naturalHeight) {
            setAspectRatio(naturalWidth / naturalHeight);
          }
        }}
        onError={() => {
          setSrc((current) => (current === fallbackSrc ? "" : fallbackSrc));
        }}
      />
    </span>
  );
}
