import { forwardRef } from "react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  overlay?: React.ReactNode;
  status?: string;
}

export const CameraView = forwardRef<HTMLDivElement, Props>(({ videoRef, overlay, status }, ref) => {
  return (
    <div ref={ref} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border surface shadow-elegant">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full object-cover -scale-x-100"
      />
      {/* Scan frame */}
      <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-primary/40">
        <div className="absolute -top-px left-0 h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent scan-line" />
      </div>
      {/* corners */}
      {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((c) => (
        <div key={c} className={`absolute h-6 w-6 border-primary rounded-md ${c}`} />
      ))}
      {overlay}
      {status && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-4 py-1.5 text-xs font-medium backdrop-blur">
          {status}
        </div>
      )}
    </div>
  );
});
CameraView.displayName = "CameraView";
