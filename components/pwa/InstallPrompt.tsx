"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DownloadIcon, XIcon } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-prompt-dismissed-until";
const DISMISS_DAYS = 3;

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    "standalone" in window.navigator &&
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isDismissed() {
  const until = localStorage.getItem(DISMISSED_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismiss() {
  localStorage.setItem(
    DISMISSED_KEY,
    String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed or recently dismissed
    if (isInStandaloneMode() || isDismissed()) return;

    if (isIos()) {
      setShowIosBanner(true);
      setVisible(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (!isMobile()) return; // desktop: let the header button handle it
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function handleDismiss() {
    dismiss();
    setVisible(false);
  }

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
      setVisible(false);
    }
    setDeferred(null);
  }

  // Desktop header button (Android / Chrome on desktop)
  const isDesktop = typeof window !== "undefined" && !isMobile();
  if (!visible && deferred && isDesktop) {
    return (
      <button
        onClick={handleInstall}
        className="hidden sm:flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark"
      >
        <DownloadIcon className="size-4" />
        Install App
      </button>
    );
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-2xl bg-surface border border-white/10 p-5 shadow-2xl animate-slide-up">
        <div className="flex items-start gap-4">
          <Image
            src="/logo/sportixtv_logo.png"
            alt="SportixTV"
            width={56}
            height={56}
            className="rounded-xl shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink text-base leading-tight">Install SportixTV</p>
            <p className="text-ink-muted text-sm mt-1">
              {showIosBanner
                ? "Add to your Home Screen for the best streaming experience — no app store needed."
                : "Get instant access to live sports & TV. Fast, offline-ready, no app store needed."}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="shrink-0 rounded-full p-1 text-ink-muted hover:text-ink hover:bg-surface-2"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {showIosBanner ? (
          <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-ink-muted space-y-1">
            <p>
              1. Tap the{" "}
              <span className="font-semibold text-ink">Share</span> button{" "}
              <span className="text-base">⎋</span> at the bottom of Safari
            </p>
            <p>
              2. Scroll down and tap{" "}
              <span className="font-semibold text-ink">Add to Home Screen</span>
            </p>
            <p>3. Tap <span className="font-semibold text-ink">Add</span> to confirm</p>
          </div>
        ) : (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Install
            </button>
          </div>
        )}

        {showIosBanner && (
          <button
            onClick={handleDismiss}
            className="mt-3 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2"
          >
            Got it
          </button>
        )}
      </div>
    </>
  );
}
