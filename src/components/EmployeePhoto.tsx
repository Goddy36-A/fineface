import { useEffect, useState } from "react";
import { resolvePhotoUrl } from "@/lib/photoUrl";

interface Props {
  photoRef: string | null | undefined;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}

export function EmployeePhoto({ photoRef, alt, className, fallback }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolvePhotoUrl(photoRef).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [photoRef]);
  if (!url) return <>{fallback}</>;
  return <img src={url} alt={alt} className={className} />;
}
