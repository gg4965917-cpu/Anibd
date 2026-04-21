"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Source, HlsEpisode } from "@/lib/sources";

type Props = {
  sources: Source[];
  title: string;
};

export function VideoPlayer({ sources, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = sources[activeIdx];

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
        {active.kind === "hls" && (
          <HlsPlayer
            key={`hls-${activeIdx}`}
            episodes={active.episodes}
            fallbackUrl={active.firstUrl}
            title={title}
          />
        )}
        {active.kind === "trailer" && (
          <iframe
            key={`yt-${activeIdx}`}
            src={active.url}
            title={`${title} — ${active.label}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        )}
        {active.kind === "iframe" && (
          <iframe
            key={`if-${activeIdx}`}
            src={active.url}
            title={`${title} — ${active.label}`}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full"
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {sources.map((s, i) => (
          <button
            key={`${s.provider}-${i}`}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              i === activeIdx
                ? "border-brand bg-brand/10 text-brand"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800",
            ].join(" ")}
          >
            {s.label}
          </button>
        ))}
        {active.kind === "hls" && active.externalUrl && (
          <a
            href={active.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-slate-400 hover:text-slate-200"
          >
            Відкрити на AniLibria →
          </a>
        )}
      </div>
    </div>
  );
}

function HlsPlayer({
  episodes,
  fallbackUrl,
  title,
}: {
  episodes: HlsEpisode[];
  fallbackUrl: string;
  title: string;
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
        cleanup = () => hls.destroy();
      } else {
        video.src = url;
      }
    })();

    return () => {
      destroyed = true;
      cleanup();
    };
  }, [url]);

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
