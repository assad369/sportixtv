"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type Hls from "hls.js";
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  MaximizeIcon,
  SettingsIcon,
  RefreshIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

interface Props {
  channelId: string;
  channelName: string;
  sourceLabels: string[];
  sourceTypes: ("hls" | "iframe")[];
  poster?: string;
}

type PlayerState = "loading" | "playing" | "paused" | "error";

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
}

interface IframeAttrs {
  src: string;
  allow?: string;
  allowFullScreen?: boolean;
  scrolling?: string;
}

function parseIframeCode(code: string): IframeAttrs | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(code, "text/html");
  const el = doc.querySelector("iframe");
  if (!el) return null;
  const src = el.getAttribute("src");
  if (!src) return null;
  return {
    src,
    allow: el.getAttribute("allow") ?? undefined,
    allowFullScreen:
      el.hasAttribute("allowfullscreen") || el.hasAttribute("allowFullScreen"),
    scrolling: el.getAttribute("scrolling") ?? undefined,
  };
}

type SourceResult =
  | { type: "hls"; url: string }
  | { type: "iframe"; code: string }
  | null;

async function fetchSource(
  channelId: string,
  sourceIndex: number,
): Promise<SourceResult> {
  try {
    const res = await fetch("/api/stream/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, sourceIndex }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === "iframe" && data.code) return { type: "iframe", code: data.code };
    if (data.url) return { type: "hls", url: data.url };
    return null;
  } catch {
    return null;
  }
}

export function LivePlayer({ channelId, channelName, sourceLabels, sourceTypes, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retriedRef = useRef(false);
  const loadRef = useRef<(index: number) => void>(() => {});

  const [state, setState] = useState<PlayerState>("loading");
  const [sourceIndex, setSourceIndex] = useState(0);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [muted, setMuted] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [iframeAttrs, setIframeAttrs] = useState<IframeAttrs | null>(null);

  const destroy = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  const failover = useCallback(() => {
    setSourceIndex((idx) => {
      if (idx + 1 < sourceLabels.length) {
        retriedRef.current = false;
        return idx + 1;
      }
      setState("error");
      return idx;
    });
  }, [sourceLabels.length]);

  const load = useCallback(
    async (index: number) => {
      const video = videoRef.current;
      destroy();
      setIframeAttrs(null);
      setState("loading");
      setLevels([]);

      const result = await fetchSource(channelId, index);
      if (!result) {
        if (!retriedRef.current) {
          retriedRef.current = true;
          failover();
        } else {
          setState("error");
        }
        return;
      }

      if (result.type === "iframe") {
        const attrs = parseIframeCode(result.code);
        if (!attrs) {
          setState("error");
          return;
        }
        setIframeAttrs(attrs);
        setState("playing");
        return;
      }

      // HLS path
      if (!video) return;
      const url = result.url;

      const HlsMod = (await import("hls.js")).default;
      if (HlsMod.isSupported()) {
        const hls = new HlsMod({
          liveSyncDurationCount: 3,
          enableWorker: true,
          fragLoadingMaxRetry: 4,
          manifestLoadingMaxRetry: 2,
          levelLoadingMaxRetry: 4,
        });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.loadSource(url);

        hls.on(HlsMod.Events.MANIFEST_PARSED, () => {
          setLevels(
            hls.levels.map((l, i) => ({
              index: i,
              height: l.height,
              bitrate: l.bitrate,
            })),
          );
          video.play().catch(() => {
            video.muted = true;
            setMuted(true);
            video.play().catch(() => setState("paused"));
          });
        });

        hls.on(HlsMod.Events.LEVEL_SWITCHED, (_e, data) => {
          setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
        });

        hls.on(HlsMod.Events.ERROR, (_e, data) => {
          if (!data.fatal) return;
          if (data.type === HlsMod.ErrorTypes.MEDIA_ERROR && !retriedRef.current) {
            retriedRef.current = true;
            hls.recoverMediaError();
            return;
          }
          if (data.type === HlsMod.ErrorTypes.NETWORK_ERROR && !retriedRef.current) {
            retriedRef.current = true;
            loadRef.current(index);
            return;
          }
          destroy();
          failover();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.play().catch(() => {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => setState("paused"));
        });
      } else {
        setState("error");
      }
    },
    [channelId, destroy, failover],
  );

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load(sourceIndex);
    return destroy;
  }, [sourceIndex, load, destroy]);

  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setControlsVisible(false);
      setShowQuality(false);
    }, 3000);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const goToLive = () => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (video && hls && hls.liveSyncPosition) {
      video.currentTime = hls.liveSyncPosition;
      video.play().catch(() => undefined);
    }
  };

  const setQuality = (index: number) => {
    const hls = hlsRef.current;
    if (hls) hls.currentLevel = index;
    setCurrentLevel(index);
    setShowQuality(false);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      el.requestFullscreen().catch(() => {
        const video = videoRef.current as HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        };
        video?.webkitEnterFullscreen?.();
      });
    }
  };

  const retry = () => {
    retriedRef.current = false;
    if (sourceIndex === 0) load(0);
    else setSourceIndex(0);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        onMouseMove={pokeControls}
        onTouchStart={pokeControls}
        className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      >
        {iframeAttrs ? (
          <iframe
            src={iframeAttrs.src}
            className="h-full w-full border-0"
            allow={iframeAttrs.allow ?? "autoplay; fullscreen; encrypted-media; picture-in-picture"}
            allowFullScreen={iframeAttrs.allowFullScreen}
            scrolling={iframeAttrs.scrolling}
          />
        ) : (
          <video
            ref={videoRef}
            poster={poster}
            playsInline
            onPlaying={() => setState("playing")}
            onPause={() => setState("paused")}
            onWaiting={() => setState("loading")}
            onClick={togglePlay}
            className="h-full w-full"
          />
        )}

        {/* SportixTV watermark — covers broadcaster logo in top-right */}
        <div className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm sm:right-3 sm:top-3 sm:gap-2 sm:px-3 sm:py-2">
          <Image
            src="/logo/sportixtv_logo.png"
            alt="SportixTV"
            width={28}
            height={28}
            className="size-4 rounded-full object-cover sm:size-7"
            unoptimized
          />
          <span className="text-[9px] font-semibold tracking-wide text-white/90 sm:text-xs">
            sportixtv.online
          </span>
        </div>

        {!iframeAttrs && state === "loading" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="size-12 animate-spin rounded-full border-4 border-white/20 border-t-brand" />
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-black/80">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="font-semibold text-white">Stream unavailable</p>
              <p className="max-w-xs text-sm text-white/60">
                All servers for {channelName} failed. Try again in a moment.
              </p>
              <button
                onClick={retry}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                <RefreshIcon className="size-4" /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Controls bar — only shown for HLS sources */}
        {!iframeAttrs && (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity",
              controlsVisible || state !== "playing"
                ? "opacity-100"
                : "opacity-0",
            )}
          >
            <button
              onClick={togglePlay}
              aria-label={state === "playing" ? "Pause" : "Play"}
              className="text-white hover:text-brand"
            >
              {state === "playing" ? (
                <PauseIcon className="size-6" />
              ) : (
                <PlayIcon className="size-6" />
              )}
            </button>

            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="text-white hover:text-brand"
            >
              <VolumeIcon className="size-5" muted={muted} />
            </button>

            <button
              onClick={goToLive}
              className="flex items-center gap-1.5 rounded bg-live/90 px-2 py-0.5 text-[11px] font-bold uppercase text-white"
            >
              <span className="size-1.5 rounded-full bg-white animate-pulse-live" />
              Live
            </button>

            <div className="ml-auto flex items-center gap-3">
              {levels.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowQuality((s) => !s)}
                    aria-label="Quality"
                    className="flex items-center gap-1 text-white hover:text-brand"
                  >
                    <SettingsIcon className="size-5" />
                    <span className="text-xs">
                      {currentLevel === -1
                        ? "Auto"
                        : `${levels[currentLevel]?.height ?? "?"}p`}
                    </span>
                  </button>
                  {showQuality && (
                    <div className="absolute bottom-8 right-0 min-w-24 rounded-lg border border-white/10 bg-black/90 py-1 text-sm">
                      <button
                        onClick={() => setQuality(-1)}
                        className={cn(
                          "block w-full px-4 py-1.5 text-left hover:bg-white/10",
                          currentLevel === -1 ? "text-brand" : "text-white",
                        )}
                      >
                        Auto
                      </button>
                      {[...levels]
                        .sort((a, b) => b.height - a.height)
                        .map((l) => (
                          <button
                            key={l.index}
                            onClick={() => setQuality(l.index)}
                            className={cn(
                              "block w-full px-4 py-1.5 text-left hover:bg-white/10",
                              currentLevel === l.index
                                ? "text-brand"
                                : "text-white",
                            )}
                          >
                            {l.height}p
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
                className="text-white hover:text-brand"
              >
                <MaximizeIcon className="size-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Source switcher */}
      {sourceLabels.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-faint">Servers:</span>
          {sourceLabels.map((label, i) => (
            <button
              key={`${label}-${i}`}
              onClick={() => {
                retriedRef.current = false;
                setSourceIndex(i);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                i === sourceIndex
                  ? "border-brand bg-brand/15 text-brand"
                  : "border-edge bg-surface text-ink-muted hover:border-brand/50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
