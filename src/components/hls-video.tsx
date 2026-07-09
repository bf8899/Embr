"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type VideoHTMLAttributes,
} from "react";
import Hls from "hls.js";

type Props = Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
  src: string;
  /** True when `src` is an HLS manifest (Mux); false for a direct file URL. */
  hls: boolean;
};

// One <video> for both providers: Mux serves HLS (attached via hls.js where the
// browser can't play it natively), storage serves a plain file URL. The inner
// element is forwarded so callers (Flow's IntersectionObserver autoplay) drive
// it exactly like a native video.
export const HlsVideo = forwardRef<HTMLVideoElement, Props>(function HlsVideo(
  { src, hls, ...rest },
  ref
) {
  const innerRef = useRef<HTMLVideoElement | null>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLVideoElement, []);

  useEffect(() => {
    const video = innerRef.current;
    if (!video) return;

    // Direct file, or Safari/iOS which plays HLS natively.
    if (!hls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    if (Hls.isSupported()) {
      const instance = new Hls({ enableWorker: true });
      instance.loadSource(src);
      instance.attachMedia(video);
      return () => instance.destroy();
    }

    // No hls.js support and not native — last-ditch direct assignment.
    video.src = src;
  }, [src, hls]);

  return <video ref={innerRef} {...rest} />;
});
