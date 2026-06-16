/**
 * In-code blog content registry.
 *
 * Posts are authored as structured content blocks (no markdown/MDX dependency) and
 * rendered by `components/blog/PostBody.tsx` using the site's existing design tokens.
 * Each post is SEO-targeted at a keyword cluster; bodies are original, people-first
 * content with honest framing (we host nothing — streams are third-party).
 *
 * Dates are ISO 8601 WITH a timezone offset so they pass Google's structured-data
 * datetime validation (see BlogPosting JSON-LD in lib/seo/jsonld.ts).
 */

export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "cta"; href: string; label: string };

export interface PostFaq {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  lang: "en" | "bn";
  title: string;
  /** Meta description, kept under ~160 chars. */
  description: string;
  keywords: string[];
  /** ISO 8601 with timezone offset, e.g. 2026-06-16T00:00:00+00:00 */
  publishedAt: string;
  updatedAt: string;
  body: PostBlock[];
  faqs?: PostFaq[];
  relatedSlugs?: string[];
}

const PUBLISHED = "2026-06-16T09:00:00+00:00";
const UPDATED = "2026-06-16T09:00:00+00:00";

/** Reused honesty/disclaimer block, consistent with About/Footer/DMCA stance. */
const DISCLAIMER_EN: PostBlock = {
  type: "p",
  text: "SportixTV does not host, upload or store any video content on its servers. All live streams are provided by publicly available third-party sources, and we simply organise links so they are easy to find. If you have a content concern, please see our DMCA page.",
};

const DISCLAIMER_BN: PostBlock = {
  type: "p",
  text: "SportixTV কোনো ভিডিও কনটেন্ট নিজস্ব সার্ভারে হোস্ট, আপলোড বা সংরক্ষণ করে না। সমস্ত লাইভ স্ট্রিম তৃতীয় পক্ষের প্রকাশ্য উৎস থেকে আসে; আমরা শুধু লিংকগুলো সহজে খুঁজে পাওয়ার মতো করে সাজিয়ে রাখি। কোনো কনটেন্ট সংক্রান্ত আপত্তি থাকলে আমাদের DMCA পেজ দেখুন।",
};

export const BLOG_POSTS: BlogPost[] = [
  // 1 — Brand / what is SportixTV
  {
    slug: "what-is-sportixtv",
    lang: "en",
    title: "SportixTV: Watch Sport TV Live Online Free",
    description:
      "SportixTV is a free platform to watch sport TV live online and stream live TV channels in HD — no app, no sign-up. Here's how it works.",
    keywords: [
      "sportixtv",
      "sportix tv",
      "sportixtv.online",
      "sport tv online",
      "sport tv live streaming",
      "watch sport tv live free",
    ],
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    body: [
      {
        type: "p",
        text: "SportixTV (sportixtv.online) is a free live streaming platform where you can watch sport TV live online and tune into hundreds of live TV channels in HD. There is nothing to install and no account to create — open the site, pick a channel or event, and start watching on any device.",
      },
      { type: "h2", text: "What can you watch on SportixTV?" },
      {
        type: "p",
        text: "The library spans live sport and general entertainment, so whether you came for a match or just want something on in the background, there is usually a channel for it:",
      },
      {
        type: "ul",
        items: [
          "Live sports: cricket, football (soccer), basketball, tennis, rugby, boxing, MMA, Formula 1 and more.",
          "News channels from around the world.",
          "Entertainment, movies, music and kids' channels.",
          "Live and upcoming sports events with a direct link to the stream when it goes live.",
        ],
      },
      { type: "cta", href: "/categories", label: "Browse all channel categories" },
      { type: "h2", text: "Why people use SportixTV" },
      {
        type: "p",
        text: "It is built to be fast and simple. Sport TV online should not require five steps and a subscription — on SportixTV the stream is one tap away.",
      },
      {
        type: "ul",
        items: [
          "100% free — no subscription and no registration.",
          "Works on any device: phone, tablet, laptop, desktop or smart TV.",
          "HD quality where the source provides it.",
          "Multiple servers for many channels, so if one link is slow you can switch.",
          "Installable as an app (PWA) straight from your browser — no Play Store needed.",
        ],
      },
      { type: "h2", text: "How to watch sport TV live on SportixTV" },
      {
        type: "p",
        text: "Getting to a live stream takes a few seconds. Open the homepage to see what is live now, use the categories to find a specific kind of channel, or check the events page for fixtures that are about to start.",
      },
      { type: "cta", href: "/events", label: "See live & upcoming events" },
      {
        type: "p",
        text: "If you want SportixTV to behave like an app, your browser can add it to your home screen. Once installed it opens full-screen with its own icon, just like a downloaded app — see our guide on watching all TV channels live for the exact steps.",
      },
      { type: "cta", href: "/blog/watch-all-tv-channels-live-free", label: "Read: Watch all TV channels live free (+ install the app)" },
      DISCLAIMER_EN,
    ],
    faqs: [
      {
        q: "Is SportixTV free?",
        a: "Yes. SportixTV is completely free to use. There is no subscription and no registration — just open sportixtv.online and start watching.",
      },
      {
        q: "Do I need to download an app to use SportixTV?",
        a: "No. SportixTV runs in your web browser. You can optionally install it as a PWA (add to home screen) so it behaves like an app, but there is nothing to download from an app store.",
      },
      {
        q: "What devices does SportixTV work on?",
        a: "Any device with a modern web browser — Android and iPhone, tablets, laptops, desktops and most smart TVs.",
      },
    ],
    relatedSlugs: ["sport-tv-live", "watch-all-tv-channels-live-free", "live-sports-tv-channels"],
  },

  // 2 — Sport TV live (Sport TV 1 / 2)
  {
    slug: "sport-tv-live",
    lang: "en",
    title: "Sport TV Live: Watch Sport TV 1 & 2 Live Streaming Free",
    description:
      "Looking for Sport TV live? Learn how to watch Sport TV 1 and Sport TV 2 live streaming free in HD, plus today's live matches on SportixTV.",
    keywords: [
      "sport tv live",
      "sport tv 1",
      "sport tv 2 live",
      "sport tv live match",
      "sport tv 1 live",
      "sporty tv live today",
    ],
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    body: [
      {
        type: "p",
        text: "\"Sport TV live\" is one of the most searched phrases by football and sports fans, and it usually means one thing: people want to watch a live sport TV channel right now, without paying for a box or a subscription. This guide explains what Sport TV channels are and how to find a working live stream for today's matches on SportixTV.",
      },
      { type: "h2", text: "What is Sport TV?" },
      {
        type: "p",
        text: "\"Sport TV\" is a brand used by sports broadcasters in several countries — for example Sport TV 1 and Sport TV 2 are well known sports channels in Portugal. These are independent broadcasters; SportixTV is not affiliated with them. What SportixTV does is help you discover publicly available live sports streams so you can watch the match you care about.",
      },
      { type: "h2", text: "How to watch a Sport TV live match" },
      {
        type: "p",
        text: "The quickest route is to check what is live right now and jump straight in:",
      },
      {
        type: "ul",
        items: [
          "Open the SportixTV homepage to see channels that are live now.",
          "Use the Sports category to filter down to live sport TV channels.",
          "Check the Events page for the day's fixtures — each event links to its stream once it starts.",
          "If a stream buffers, switch to another server on the same channel.",
        ],
      },
      { type: "cta", href: "/events", label: "Find today's live sport TV matches" },
      { type: "h2", text: "Sport TV 1 and Sport TV 2 — finding the right stream" },
      {
        type: "p",
        text: "Channel numbers like Sport TV 1 or Sport TV 2 simply distinguish one feed from another. On SportixTV you search by what you want to watch — the league, the teams, or the channel name — and pick the live source that is working best for you. Many channels list more than one server so you always have a backup.",
      },
      { type: "cta", href: "/categories", label: "Browse sports channels" },
      {
        type: "p",
        text: "Want the full picture of what SportixTV is and how it works? Start with our introduction, then come back here when you need today's live match.",
      },
      { type: "cta", href: "/blog/what-is-sportixtv", label: "Read: What is SportixTV?" },
      DISCLAIMER_EN,
    ],
    faqs: [
      {
        q: "Can I watch Sport TV 1 and Sport TV 2 live for free?",
        a: "SportixTV aggregates publicly available live sports streams so you can watch live matches free in HD where a source is available. SportixTV is not affiliated with any Sport TV broadcaster.",
      },
      {
        q: "How do I find today's live match?",
        a: "Open the Events page or the Sports category on SportixTV. Live and upcoming fixtures are listed with a direct link to the stream once the match starts.",
      },
      {
        q: "What if the stream keeps buffering?",
        a: "Many channels offer multiple servers. If one is slow, switch to another server on the same channel for a smoother stream.",
      },
    ],
    relatedSlugs: ["what-is-sportixtv", "live-sports-tv-channels", "live-football-today-bn"],
  },

  // 3 — All TV channels live + app (PWA)
  {
    slug: "watch-all-tv-channels-live-free",
    lang: "en",
    title: "Watch All TV Channels Live Free (+ Install the App)",
    description:
      "Watch all TV channels live free on SportixTV — no app download required. Plus: how to install SportixTV as a free TV channel app on Android & iPhone.",
    keywords: [
      "all tv channel live",
      "all tv channel live app free download",
      "tv channel apps",
      "sports live tv channel",
      "sport tv app download for android",
      "sport tv app free",
    ],
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    body: [
      {
        type: "p",
        text: "If you have searched for an \"all TV channel live app free download\", you have probably found a list of apps that are full of ads, ask for odd permissions, or stop working after a week. SportixTV takes a simpler approach: watch all TV channels live free directly in your browser — and, if you want an app-like experience, install SportixTV to your home screen in two taps. No Play Store, no APK, no permissions.",
      },
      { type: "h2", text: "Watch live TV channels with no download" },
      {
        type: "p",
        text: "Everything works in the browser you already have. Open SportixTV, choose a category, and start watching a live TV channel instantly:",
      },
      {
        type: "ul",
        items: [
          "Sports live TV channels — football, cricket and more.",
          "News, entertainment, movies, music and kids' channels.",
          "Multiple servers per channel for reliability.",
          "No registration and no subscription.",
        ],
      },
      { type: "cta", href: "/categories", label: "Browse all live TV categories" },
      { type: "h2", text: "Install SportixTV as a free TV channel app (PWA)" },
      {
        type: "p",
        text: "SportixTV is a Progressive Web App (PWA). That means your phone or computer can install it like a normal app — it gets its own icon and opens full-screen — but it stays lightweight and always up to date. This is the safe, honest alternative to downloading a random \"TV channel app\".",
      },
      { type: "h3", text: "On Android (Chrome)" },
      {
        type: "ul",
        items: [
          "Open sportixtv.online in Chrome.",
          "Tap the three-dot menu in the top-right corner.",
          "Tap \"Add to Home screen\" (or \"Install app\").",
          "Confirm — the SportixTV icon now sits on your home screen like any app.",
        ],
      },
      { type: "h3", text: "On iPhone / iPad (Safari)" },
      {
        type: "ul",
        items: [
          "Open sportixtv.online in Safari.",
          "Tap the Share button (the square with an arrow).",
          "Scroll down and tap \"Add to Home Screen\".",
          "Tap \"Add\" — SportixTV opens full-screen from your home screen.",
        ],
      },
      {
        type: "p",
        text: "That is the whole \"app download\" — no separate APK, no app store, and nothing to update manually. You get a sports live TV channel app experience with the safety of the open web.",
      },
      { type: "cta", href: "/", label: "Start watching live TV now" },
      DISCLAIMER_EN,
    ],
    faqs: [
      {
        q: "Is there a SportixTV app to download for Android?",
        a: "SportixTV is a Progressive Web App, so instead of downloading an APK you 'Add to Home screen' from Chrome. It then behaves like an installed app with its own icon, but stays safe and always up to date.",
      },
      {
        q: "Can I watch all TV channels live for free without an app?",
        a: "Yes. SportixTV runs entirely in your browser, so you can watch live TV channels free without downloading anything.",
      },
      {
        q: "Is installing the PWA safe?",
        a: "Yes. A PWA installs from your browser and does not request the risky device permissions that many third-party 'TV channel apps' ask for.",
      },
    ],
    relatedSlugs: ["what-is-sportixtv", "live-sports-tv-channels", "all-bangladeshi-tv-channel-live"],
  },

  // 4 — Live sports TV channels
  {
    slug: "live-sports-tv-channels",
    lang: "en",
    title: "Live Sports TV Channels: Football, Cricket & More in HD",
    description:
      "Watch live sports TV channels free in HD on SportixTV — football, cricket, basketball and more. Find today's sport TV live match in seconds.",
    keywords: [
      "sports live tv channel",
      "live sports tv channels",
      "sport tv live match",
      "watch live sports free",
      "live cricket tv channel",
      "live football tv channel",
    ],
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    body: [
      {
        type: "p",
        text: "A good sports live TV channel is one you can reach in seconds, that plays in HD, and that has a backup when a stream drops. SportixTV brings live sports TV channels together in one place so you can go straight from \"what's on?\" to watching the game.",
      },
      { type: "h2", text: "Sports you can watch live" },
      {
        type: "ul",
        items: [
          "Football (soccer) — leagues, cups and internationals.",
          "Cricket — international Tests, ODIs, T20s and franchise leagues like IPL, PSL and BBL.",
          "Basketball, tennis, rugby, boxing, MMA and Formula 1.",
          "Major one-off sporting events as they happen.",
        ],
      },
      { type: "cta", href: "/categories", label: "Open the sports channel list" },
      { type: "h2", text: "Find today's sport TV live match" },
      {
        type: "p",
        text: "The Events page is the fastest way to a live match. It lists what is on now and what is coming up, with a direct link to each stream when it begins. No guessing which channel has the game.",
      },
      { type: "cta", href: "/events", label: "Check live & upcoming matches" },
      { type: "h2", text: "Tips for a smooth live stream" },
      {
        type: "ul",
        items: [
          "Use Wi-Fi where you can for the most stable HD stream.",
          "If a stream buffers, switch servers — most channels offer more than one.",
          "Install SportixTV to your home screen for one-tap access to live sport.",
        ],
      },
      { type: "cta", href: "/blog/watch-all-tv-channels-live-free", label: "Read: How to install SportixTV as an app" },
      DISCLAIMER_EN,
    ],
    faqs: [
      {
        q: "Can I watch live sports for free on SportixTV?",
        a: "Yes. SportixTV aggregates publicly available live sports streams so you can watch football, cricket and more for free in HD.",
      },
      {
        q: "Where can I watch cricket live online for free?",
        a: "Open the Sports category or Events page on SportixTV. International matches and major franchise leagues are listed with a link to the live stream.",
      },
      {
        q: "How do I find which channel has tonight's match?",
        a: "Use the Events page. Each fixture links directly to its stream once the match starts, so you don't have to search channel by channel.",
      },
    ],
    relatedSlugs: ["sport-tv-live", "what-is-sportixtv", "live-football-today-bn"],
  },

  // 5 — T Sports live (BN)
  {
    slug: "t-sports-live",
    lang: "bn",
    title: "টি স্পোর্টস লাইভ: আজকের খেলা সরাসরি দেখুন ফ্রি",
    description:
      "টি স্পোর্টস লাইভ ও আজকের খেলা সরাসরি দেখতে চান? SportixTV-তে ফ্রিতে স্পোর্টস টিভি ও লাইভ খেলা HD-তে দেখার সহজ উপায় জেনে নিন।",
    keywords: [
      "টি স্পোর্টস আজকের খেলা",
      "টি স্পোর্টস লাইভ",
      "স্পোর্টস টিভি",
      "t sports live",
      "t sports ajker khela",
    ],
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    body: [
      {
        type: "p",
        text: "বাংলাদেশের ক্রিকেট আর ফুটবল ভক্তদের কাছে \"টি স্পোর্টস লাইভ\" আর \"টি স্পোর্টস আজকের খেলা\" সবচেয়ে বেশি খোঁজা শব্দগুলোর একটি। মানেটা সহজ — মানুষ এখনই, কোনো ঝামেলা ছাড়া, লাইভ খেলা দেখতে চায়। এই গাইডে দেখানো হলো SportixTV-তে কীভাবে ফ্রিতে স্পোর্টস টিভি দেখে আজকের খেলা সরাসরি উপভোগ করবেন।",
      },
      { type: "h2", text: "টি স্পোর্টস কী?" },
      {
        type: "p",
        text: "টি স্পোর্টস (T Sports) বাংলাদেশের একটি জনপ্রিয় খেলাধুলার টিভি চ্যানেল, যেখানে ক্রিকেট ও ফুটবলের বড় বড় ইভেন্ট সম্প্রচার হয়। এটি একটি স্বাধীন সম্প্রচারকারী প্রতিষ্ঠান এবং SportixTV-র সঙ্গে এর কোনো সম্পর্ক নেই। SportixTV শুধু প্রকাশ্যে থাকা লাইভ স্ট্রিমগুলো সহজে খুঁজে পাওয়ার ব্যবস্থা করে দেয়, যাতে আপনি আপনার পছন্দের খেলা দেখতে পারেন।",
      },
      { type: "h2", text: "আজকের খেলা সরাসরি দেখার উপায়" },
      {
        type: "ul",
        items: [
          "SportixTV-র হোমপেজ খুলুন — এখন কোন চ্যানেল লাইভ আছে দেখে নিন।",
          "Sports ক্যাটাগরিতে গিয়ে স্পোর্টস টিভি চ্যানেলগুলো খুঁজুন।",
          "Events পেজে আজকের সব খেলার তালিকা ও সরাসরি লিংক পাবেন।",
          "স্ট্রিম আটকে গেলে একই চ্যানেলের অন্য সার্ভারে সুইচ করুন।",
        ],
      },
      { type: "cta", href: "/events", label: "আজকের লাইভ খেলা দেখুন" },
      { type: "h2", text: "ফ্রিতে স্পোর্টস টিভি — কেন SportixTV?" },
      {
        type: "ul",
        items: [
          "সম্পূর্ণ ফ্রি — কোনো সাবস্ক্রিপশন বা রেজিস্ট্রেশন লাগে না।",
          "মোবাইল, ট্যাব, ল্যাপটপ, স্মার্ট টিভি — যেকোনো ডিভাইসে চলে।",
          "উৎস ভালো থাকলে HD কোয়ালিটিতে খেলা দেখা যায়।",
          "অনেক চ্যানেলে একাধিক সার্ভার, তাই একটি ধীর হলে অন্যটি ব্যবহার করা যায়।",
        ],
      },
      { type: "cta", href: "/categories", label: "সব চ্যানেল ক্যাটাগরি দেখুন" },
      {
        type: "p",
        text: "আজকের লাইভ ফুটবল খেলা খুঁজছেন? আমাদের আলাদা গাইডে ফুটবল ম্যাচ সরাসরি দেখার সহজ উপায় দেওয়া আছে।",
      },
      { type: "cta", href: "/blog/live-football-today-bn", label: "পড়ুন: আজকের লাইভ ফুটবল খেলা সরাসরি দেখুন" },
      DISCLAIMER_BN,
    ],
    faqs: [
      {
        q: "টি স্পোর্টস লাইভ কি ফ্রিতে দেখা যায়?",
        a: "SportixTV প্রকাশ্যে থাকা লাইভ স্পোর্টস স্ট্রিম একত্র করে, তাই উৎস থাকলে আপনি ফ্রিতে HD-তে লাইভ খেলা দেখতে পারেন। SportixTV কোনো টি স্পোর্টস ব্র্যান্ডের সঙ্গে যুক্ত নয়।",
      },
      {
        q: "আজকের খেলা কোথায় দেখব?",
        a: "SportixTV-র Events পেজ বা Sports ক্যাটাগরি খুলুন। আজকের ও আসন্ন খেলার তালিকা এবং সরাসরি লিংক সেখানে পাওয়া যাবে।",
      },
      {
        q: "অ্যাপ ডাউনলোড করতে হবে কি?",
        a: "না। SportixTV ব্রাউজারেই চলে। চাইলে এটি হোম স্ক্রিনে যোগ করে অ্যাপের মতো ব্যবহার করতে পারেন, কিন্তু আলাদা কিছু ডাউনলোড করার দরকার নেই।",
      },
    ],
    relatedSlugs: ["live-football-today-bn", "all-bangladeshi-tv-channel-live", "live-sports-tv-channels"],
  },

  // 6 — Live football today (BN)
  {
    slug: "live-football-today-bn",
    lang: "bn",
    title: "আজকের লাইভ ফুটবল খেলা সরাসরি দেখুন (ফ্রি)",
    description:
      "আজকের লাইভ ফুটবল খেলা সরাসরি দেখতে চান? SportixTV-তে ফ্রিতে স্পোর্টস টিভিতে আজকের ফুটবল ম্যাচ HD-তে দেখার সহজ উপায় জানুন।",
    keywords: [
      "আজকের লাইভ ফুটবল খেলা",
      "লাইভ ফুটবল খেলা",
      "স্পোর্টস টিভি",
      "live football today",
      "ajker live football khela",
    ],
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    body: [
      {
        type: "p",
        text: "আজকের লাইভ ফুটবল খেলা সরাসরি দেখতে চাইলে আপনাকে আর বিভিন্ন সাইটে ঘুরতে হবে না। SportixTV-তে প্রিমিয়ার লিগ, লা লিগা, চ্যাম্পিয়নস লিগ থেকে শুরু করে আন্তর্জাতিক ম্যাচ পর্যন্ত — সব লাইভ ফুটবল এক জায়গায় ফ্রিতে দেখা যায়।",
      },
      { type: "h2", text: "আজকের ফুটবল ম্যাচ কোথায় দেখবেন" },
      {
        type: "p",
        text: "সবচেয়ে দ্রুত উপায় হলো Events পেজ। সেখানে আজকের ও আসন্ন ম্যাচগুলোর তালিকা থাকে, এবং খেলা শুরু হলে সরাসরি স্ট্রিমের লিংক পাওয়া যায়।",
      },
      { type: "cta", href: "/events", label: "আজকের ফুটবল ম্যাচ দেখুন" },
      { type: "h2", text: "কোন কোন ফুটবল দেখা যায়" },
      {
        type: "ul",
        items: [
          "ইংলিশ প্রিমিয়ার লিগ, লা লিগা, সিরি আ, বুন্দেসলিগা।",
          "উয়েফা চ্যাম্পিয়নস লিগ ও ইউরোপা লিগ।",
          "আন্তর্জাতিক ম্যাচ, বিশ্বকাপ ও মহাদেশীয় টুর্নামেন্ট।",
          "বড় ক্লাব ও দেশগুলোর প্রীতি ম্যাচ।",
        ],
      },
      { type: "cta", href: "/categories", label: "স্পোর্টস টিভি চ্যানেল দেখুন" },
      { type: "h2", text: "ভালো স্ট্রিমের জন্য কিছু টিপস" },
      {
        type: "ul",
        items: [
          "সম্ভব হলে Wi-Fi ব্যবহার করুন — HD স্ট্রিম বেশি স্থিতিশীল থাকে।",
          "স্ট্রিম আটকে গেলে চ্যানেলের অন্য সার্ভারে যান।",
          "এক ট্যাপে খেলায় পৌঁছাতে SportixTV হোম স্ক্রিনে যোগ করে নিন।",
        ],
      },
      { type: "cta", href: "/blog/t-sports-live", label: "পড়ুন: টি স্পোর্টস লাইভ ও আজকের খেলা" },
      DISCLAIMER_BN,
    ],
    faqs: [
      {
        q: "আজকের লাইভ ফুটবল খেলা কি ফ্রিতে দেখা যায়?",
        a: "হ্যাঁ। SportixTV প্রকাশ্যে থাকা লাইভ স্ট্রিম একত্র করে, তাই উৎস থাকলে আপনি ফ্রিতে HD-তে আজকের ফুটবল ম্যাচ দেখতে পারেন।",
      },
      {
        q: "আজকের ম্যাচের তালিকা কোথায় পাব?",
        a: "SportixTV-র Events পেজে আজকের ও আসন্ন ফুটবল ম্যাচের তালিকা ও সরাসরি লিংক পাওয়া যায়।",
      },
      {
        q: "স্ট্রিম বাফার করলে কী করব?",
        a: "বেশিরভাগ চ্যানেলে একাধিক সার্ভার থাকে। একটি ধীর হলে একই চ্যানেলের অন্য সার্ভারে সুইচ করুন।",
      },
    ],
    relatedSlugs: ["t-sports-live", "all-bangladeshi-tv-channel-live", "live-sports-tv-channels"],
  },

  // 7 — All Bangladeshi TV channel live / BD TV / Toffee alternative (BN)
  {
    slug: "all-bangladeshi-tv-channel-live",
    lang: "bn",
    title: "সকল বাংলাদেশি টিভি চ্যানেল লাইভ দেখুন (BD TV Live)",
    description:
      "সকল বাংলাদেশি টিভি চ্যানেল লাইভ (BD TV Live) ফ্রিতে দেখুন SportixTV-তে — টফি টিভির সহজ বিকল্প, কোনো অ্যাপ ডাউনলোড ছাড়াই।",
    keywords: [
      "all bangladeshi tv channel live",
      "bd tv live",
      "টফি টিভি বাংলাদেশ লাইভ",
      "bangladeshi tv channel live",
      "toffee tv alternative",
    ],
    publishedAt: PUBLISHED,
    updatedAt: UPDATED,
    body: [
      {
        type: "p",
        text: "সকল বাংলাদেশি টিভি চ্যানেল লাইভ এক জায়গায় দেখতে চান? SportixTV-তে BD TV Live — খবর, খেলা, বিনোদন ও নাটকের চ্যানেলগুলো ফ্রিতে, কোনো অ্যাপ ডাউনলোড ছাড়াই ব্রাউজারে সরাসরি দেখা যায়।",
      },
      { type: "h2", text: "BD TV Live — কী কী দেখা যায়" },
      {
        type: "ul",
        items: [
          "বাংলা সংবাদ চ্যানেল।",
          "খেলাধুলার চ্যানেল — ক্রিকেট ও ফুটবল লাইভ।",
          "বিনোদন, নাটক, সিনেমা ও মিউজিক চ্যানেল।",
          "শিশুদের চ্যানেল ও আরও অনেক কিছু।",
        ],
      },
      { type: "cta", href: "/categories", label: "সব চ্যানেল ক্যাটাগরি দেখুন" },
      { type: "h2", text: "টফি টিভির সহজ বিকল্প" },
      {
        type: "p",
        text: "টফি (Toffee) বাংলাদেশের একটি জনপ্রিয় স্ট্রিমিং অ্যাপ; এটি একটি স্বাধীন সেবা এবং SportixTV-র সঙ্গে যুক্ত নয়। আপনি যদি অ্যাপ ইনস্টল ছাড়াই ব্রাউজারে সকল বাংলাদেশি টিভি চ্যানেল লাইভ দেখার সহজ উপায় খুঁজে থাকেন, তাহলে SportixTV একটি ভালো বিকল্প — খুলুন আর দেখা শুরু করুন।",
      },
      { type: "h2", text: "অ্যাপ ছাড়াই দেখুন, চাইলে অ্যাপের মতো ইনস্টল করুন" },
      {
        type: "p",
        text: "SportixTV ব্রাউজারেই চলে, তাই কিছু ডাউনলোড করার দরকার নেই। তবু অ্যাপের মতো অভিজ্ঞতা চাইলে এটি হোম স্ক্রিনে যোগ করতে পারেন — নিজস্ব আইকনসহ ফুল-স্ক্রিনে খুলবে, একদম অ্যাপের মতো।",
      },
      { type: "cta", href: "/blog/watch-all-tv-channels-live-free", label: "পড়ুন: কীভাবে SportixTV অ্যাপের মতো ইনস্টল করবেন" },
      DISCLAIMER_BN,
    ],
    faqs: [
      {
        q: "সকল বাংলাদেশি টিভি চ্যানেল কি ফ্রিতে লাইভ দেখা যায়?",
        a: "হ্যাঁ। SportixTV প্রকাশ্যে থাকা লাইভ স্ট্রিম একত্র করে, তাই উৎস থাকলে আপনি ফ্রিতে বাংলাদেশি টিভি চ্যানেল লাইভ দেখতে পারেন।",
      },
      {
        q: "টফি টিভির বিকল্প হিসেবে SportixTV কেমন?",
        a: "SportixTV কোনো অ্যাপ ইনস্টল ছাড়াই ব্রাউজারে লাইভ টিভি দেখার সুযোগ দেয়। এটি টফির সঙ্গে যুক্ত নয়, তবে একটি সহজ ও ফ্রি বিকল্প।",
      },
      {
        q: "অ্যাপ ডাউনলোড করতে হবে কি?",
        a: "না। SportixTV ব্রাউজারে চলে। চাইলে হোম স্ক্রিনে যোগ করে অ্যাপের মতো ব্যবহার করতে পারেন, আলাদা ডাউনলোডের দরকার নেই।",
      },
    ],
    relatedSlugs: ["t-sports-live", "live-football-today-bn", "watch-all-tv-channels-live-free"],
  },
];

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(post: BlogPost): BlogPost[] {
  if (!post.relatedSlugs?.length) return [];
  return post.relatedSlugs
    .map((s) => getPostBySlug(s))
    .filter((p): p is BlogPost => p !== undefined);
}
