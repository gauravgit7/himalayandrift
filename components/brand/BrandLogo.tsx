// =============================================================================
// BrandLogo - renders an uploaded logo image or falls back to a placeholder
// Server component - purely presentational, no interactivity
// =============================================================================

interface BrandLogoProps {
  /** Public URL from Supabase Storage; null = show fallback */
  logoUrl:   string | null | undefined;
  /** Rendered when no logo is uploaded */
  fallback:  React.ReactNode;
  alt?:      string;
  className?: string;
}

export function BrandLogo({ logoUrl, fallback, alt, className }: BrandLogoProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={alt ?? ""}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <>{fallback}</>;
}
