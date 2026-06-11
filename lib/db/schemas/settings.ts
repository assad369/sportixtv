export interface SiteSettings {
  _id: "site";
  siteName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  socialLinks: {
    facebook?: string;
    telegram?: string;
    twitter?: string;
    youtube?: string;
  };
  adsenseClientId?: string;
  adsenseEnabled: boolean;
  tickerEnabled: boolean;
  popunderEnabled: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  _id: "site",
  siteName: "SportixTV",
  tagline: "Watch live sports & TV channels in HD",
  seoTitle: "SportixTV — Live Sports & TV Streaming",
  seoDescription:
    "Watch live sports events and TV channels online for free in HD. Cricket, football, news, entertainment and more.",
  seoKeywords: ["live tv", "live sports", "streaming", "watch online"],
  socialLinks: {},
  adsenseEnabled: false,
  tickerEnabled: true,
  popunderEnabled: false,
};
