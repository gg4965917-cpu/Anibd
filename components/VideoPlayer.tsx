"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Source, HlsEpisode } from "@/lib/sources";

type Props = {
  sources: Source[];
  title: string;
};

// Auto-fallback: if an iframe source fails to fire its `load` event within this
// window, we assume the provider is blocking us and advance to the next tab.
const IFRAME_LOAD_TIMEOUT_MS = 8000;

export function VideoPlayer({ sources, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [failedIdx, setFailedIdx] = useState<Set<number>>(() => new Set());
  const active = sources[activeIdx];

  const nextUsableIdx = (from: number) => {
    for (let i = from + 1; i < sources.length; i++) {
      if (!failedIdx.has(i)) return i;
    }
    for (let i = 0; i < sources.length; i++) {
      if (i !== from && !failedIdx.has(i)) return i;
    }
    return -1;
  };

  const handleFail = (idx: number) => {
    setFailedIdx((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    if (idx === activeIdx) {
      const nxt = nextUsableIdx(idx);
      if (nxt !== -1) setActiveIdx(nxt);
    }
  };

  const allFailed = failedIdx.size >= sources.length;

  if (!sources.length) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
        Джерела для цього тайтлу поки не знайдено.
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-black">
        {allFailed ? (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-slate-400">
            Жодне з джерел не відповіло. Спробуйте пізніше або відкрийте на
            сайті студії.
          </div>
        ) : (
          <>
            {active.kind === "hls" && (
              <HlsPlayer
                key={`hls-${activeIdx}`}
                episodes={active.episodes}
                fallbackUrl={active.firstUrl}
                title={title}
                onFatalError={() => handleFail(activeIdx)}
              />
            )}
            {active.kind === "trailer" && (
              <iframe
                key={`yt-${activeIdx}`}
                src={active.url}
                title={`${title} — ${active.label}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
                onError={() => handleFail(activeIdx)}
              />
            )}
            {active.kind === "iframe" && (
              <IframeWithTimeout
                key={`if-${activeIdx}`}
                src={active.url}
                title={`${title} — ${active.label}`}
                onFail={() => handleFail(activeIdx)}
                onSwitchNext={
                  nextUsableIdx(activeIdx) !== -1
                    ? () => {
                        const nxt = nextUsableIdx(activeIdx);
                        if (nxt !== -1) setActiveIdx(nxt);
                      }
                    : undefined
                }
              />
            )}
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {sources.map((s, i) => {
          const isFailed = failedIdx.has(i);
          const isActive = i === activeIdx && !allFailed;
          return (
            <button
              key={`${s.provider}-${i}`}
              type="button"
              onClick={() => {
                setFailedIdx((prev) => {
                  if (!prev.has(i)) return prev;
                  const next = new Set(prev);
                  next.delete(i);
                  return next;
                });
                setActiveIdx(i);
              }}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "border-brand bg-brand/10 text-brand"
                  : isFailed
                  ? "border-slate-800 bg-slate-900/30 text-slate-500 line-through hover:text-slate-300"
                  : "border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800",
              ].join(" ")}
              title={isFailed ? "Не відповіло — натисніть, щоб спробувати ще раз" : undefined}
            >
              {s.label}
            </button>
          );
        })}
        {!allFailed && active.kind === "hls" && active.externalUrl && (
          <a
            href={active.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-slate-400 hover:text-slate-200"
          >
            Відкрити на AniLibria →
          </a>
        )}
        {!allFailed && active.kind === "iframe" && (
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-slate-400 hover:text-slate-200"
          >
            Відкрити у новій вкладці ↗
          </a>
        )}
      </div>
    </div>
  );
}

function IframeWithTimeout({
  src,
  title,
  onFail,
  onSwitchNext,
}: {
  src: string;
  title: string;
  onFail: () => void;
  onSwitchNext?: () => void;
}) {
  const loadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    loadedRef.current = false;
    setLoaded(false);
    setTimedOut(false);
    const t = setTimeout(() => {
      if (!loadedRef.current) {
        setTimedOut(true);
        onFail();
      }
    }, IFRAME_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [src, onFail]);

  return (
    <div className="relative h-full w-full">
      {!loaded && !timedOut && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          Завантаження джерела…
        </div>
      )}
      {timedOut && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/90 p-6 text-center">
          <p className="text-sm text-slate-300">
            Це джерело не відповіло. Ймовірно, воно заблоковане у вашій мережі.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {onSwitchNext && (
              <button
                type="button"
                onClick={onSwitchNext}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-medium text-slate-950 hover:bg-brand/90"
              >
                Перемкнути джерело
              </button>
            )}
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Відкрити у новій вкладці ↗
            </a>
          </div>
        </div>
      )}
      <iframe
        src={src}
        title={title}
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full"
        onLoad={() => {
          loadedRef.current = true;
          setLoaded(true);
        }}
        onError={onFail}
      />
    </div>
  );
}

function HlsPlayer({
  episodes,
  fallbackUrl,
  title,
  onFatalError,
}: {
  episodes: HlsEpisode[];
  fallbackUrl: string;
  title: string;
  onFatalError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const list = useMemo(
    () => (episodes.length ? episodes : [{ ordinal: 1, hls_1080: fallbackUrl }]),
    [episodes, fallbackUrl]
  );
  const [epIdx, setEpIdx] = useState(0);

  const current = list[epIdx];
  const url = current?.hls_1080 || current?.hls_720 || current?.hls_480 || fallbackUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let destroyed = false;
    // Safari has native HLS. Everything else → hls.js.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return () => {
        if (!destroyed) video.removeAttribute("src");
        destroyed = true;
      };
    }

    let cleanup: () => void = () => {};
    (async () => {
      const mod = await import("hls.js");
      if (destroyed) return;
      const Hls = mod.default;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) onFatalError?.();
        });
        cleanup = () => hls.destroy();
      } else {
        video.src = url;
      }
    })();

    return () => {
      destroyed = true;
      cleanup();
    };
  }, [url, onFatalError]);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        controls
        playsInline
        className="h-full w-full bg-black"
        aria-label={title}
      />
      {list.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end">
          <div className="pointer-events-auto mx-auto mb-2 flex max-w-[90%] flex-wrap gap-1 rounded-lg bg-slate-950/70 p-1 backdrop-blur">
            {list.slice(0, 30).map((ep, i) => (
              <button
                key={ep.ordinal || i}
                type="button"
                onClick={() => setEpIdx(i)}
                className={[
                  "rounded px-2 py-0.5 text-[11px]",
                  i === epIdx
                    ? "bg-brand text-slate-950"
                    : "bg-slate-800/80 text-slate-200 hover:bg-slate-700",
                ].join(" ")}
              >
                EP {ep.ordinal || i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
