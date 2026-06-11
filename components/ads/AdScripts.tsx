import Script from "next/script";
import { getSettings } from "@/lib/data/settings";
import { getAdsByPlacement } from "@/lib/data/ads";
import { Popunder } from "./Popunder";

/** AdSense loader + popunder, driven by site settings. Lives in the public layout. */
export async function AdScripts() {
  const settings = await getSettings();
  const popunderAds = settings.popunderEnabled
    ? await getAdsByPlacement("popunder")
    : [];
  const popunder = popunderAds.find((a) => a.linkUrl);

  return (
    <>
      {settings.adsenseEnabled && settings.adsenseClientId && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsenseClientId}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      )}
      {popunder?.linkUrl && <Popunder linkUrl={popunder.linkUrl} />}
    </>
  );
}
