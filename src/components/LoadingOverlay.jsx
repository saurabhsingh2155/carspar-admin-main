import { useEffect, useRef } from "react";
import carAnimationUrl from "../assets/car_loader.json?url";

export default function LoadingOverlay() {
  const animationContainer = useRef(null);

  useEffect(() => {
    let animation;
    let cancelled = false;

    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled || !animationContainer.current) return;
      animation = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: carAnimationUrl,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
        },
      });
    });

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative flex flex-col items-center rounded-3xl border border-white/30 bg-white/90 p-7 shadow-2xl dark:border-slate-600/60 dark:bg-slate-800/95">
        <div ref={animationContainer} className="h-48 w-64 max-w-[75vw]" aria-hidden="true" />

        <div className="mt-3 flex items-center gap-2 font-semibold tracking-wide text-slate-600 dark:text-slate-200">
          <span>Loading</span>
          <span className="flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
          </span>
        </div>
      </div>
    </div>
  );
}
