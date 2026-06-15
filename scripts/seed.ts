/**
 * Seed script — run locally only: `pnpm seed`
 *
 * Creates indexes, the admin user (from ADMIN_SEED_EMAIL/PASSWORD), default
 * categories, site settings, a notice, and sample channels/events wired to
 * public test HLS streams.
 *
 * Self-contained on purpose: the app's lib/db and lib/crypto import
 * "server-only", which throws outside the Next.js server runtime. The AES
 * format here MUST stay identical to lib/crypto.ts.
 */
import { MongoClient, ObjectId } from "mongodb";
import { createCipheriv, randomBytes } from "crypto";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("No .env.local found, relying on existing environment");
}

const uri = process.env.MONGODB_URI;
const encKeyB64 = process.env.SOURCE_ENC_KEY;
const adminEmail = process.env.ADMIN_SEED_EMAIL;
const adminPassword = process.env.ADMIN_SEED_PASSWORD;
if (!uri || !encKeyB64 || !adminEmail || !adminPassword) {
  console.error(
    "Missing env: need MONGODB_URI, SOURCE_ENC_KEY, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD",
  );
  process.exit(1);
}
const encKey = Buffer.from(encKeyB64, "base64");
if (encKey.length !== 32) {
  console.error("SOURCE_ENC_KEY must be 32 bytes base64 (openssl rand -base64 32)");
  process.exit(1);
}

function encryptSecret(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    ct: ct.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

async function main() {
  const client = await new MongoClient(uri!).connect();
  const db = client.db(process.env.MONGODB_DB || "sportixtv");
  const now = new Date();

  console.log("Creating indexes...");
  await db.collection("channels").createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { categoryId: 1, isActive: 1, order: 1 } },
    { key: { isFeatured: 1, isActive: 1 } },
    { key: { viewCount: -1 } },
  ]);
  await db.collection("categories").createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { order: 1 } },
  ]);
  await db.collection("events").createIndexes([
    { key: { slug: 1 }, unique: true },
    { key: { startsAt: 1 } },
    // Idempotency key for autopilot upserts (manual events omit externalRef).
    { key: { externalRef: 1 }, unique: true, sparse: true },
    // Cross-provider dedupe lookups.
    { key: { physicalKey: 1 }, sparse: true },
  ]);
  await db
    .collection("fixtureSources")
    .createIndexes([{ key: { adapter: 1 } }, { key: { enabled: 1 } }]);
  await db.collection("leagueChannelMaps").createIndexes([
    { key: { enabled: 1, priority: -1 } },
    { key: { "match.league": 1 } },
  ]);
  await db.collection("syncRuns").createIndexes([
    { key: { startedAt: -1 } },
    { key: { sourceId: 1, startedAt: -1 } },
    // Auto-expire run logs after 30 days.
    { key: { startedAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 },
  ]);
  await db
    .collection("adSpots")
    .createIndexes([{ key: { placement: 1, isActive: 1, order: 1 } }]);
  await db
    .collection("adminUsers")
    .createIndexes([{ key: { email: 1 }, unique: true }]);
  await db
    .collection("viewEvents")
    .createIndexes([{ key: { channelId: 1, day: 1 }, unique: true }]);
  await db
    .collection("reports")
    .createIndexes([{ key: { resolved: 1, createdAt: -1 } }]);

  console.log("Seeding admin user...");
  await db.collection("adminUsers").updateOne(
    { email: adminEmail },
    {
      $set: { passwordHash: await bcrypt.hash(adminPassword!, 12) },
      $setOnInsert: { email: adminEmail, createdAt: now },
    },
    { upsert: true },
  );

  console.log("Seeding settings...");
  await db.collection("settings").updateOne(
    { _id: "site" as never },
    {
      $setOnInsert: {
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
      },
    },
    { upsert: true },
  );

  console.log("Seeding categories...");
  const cats = [
    { name: "Sports", slug: "sports", icon: "🏆" },
    { name: "News", slug: "news", icon: "📰" },
    { name: "Entertainment", slug: "entertainment", icon: "🎬" },
    { name: "Movies", slug: "movies", icon: "🍿" },
    { name: "Kids", slug: "kids", icon: "🧸" },
    { name: "Music", slug: "music", icon: "🎵" },
    { name: "Religious", slug: "religious", icon: "🕌" },
    { name: "International", slug: "international", icon: "🌍" },
  ];
  const catIds = new Map<string, ObjectId>();
  for (const [i, c] of cats.entries()) {
    const res = await db.collection("categories").findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: { ...c, order: i, isActive: true } },
      { upsert: true, returnDocument: "after" },
    );
    catIds.set(c.slug, res!._id as ObjectId);
  }

  console.log("Seeding sample channels (public test HLS streams)...");
  const sampleChannels = [
    {
      name: "Demo Sports HD",
      slug: "demo-sports-hd",
      categoryId: catIds.get("sports")!,
      logoUrl: "https://placehold.co/200x200/10b981/ffffff/png?text=SPORTS",
      description: "Demo sports channel using a public multi-quality test stream.",
      isFeatured: true,
      sources: [
        {
          label: "Server 1",
          urlEnc: encryptSecret(
            "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          ),
          order: 0,
          active: true,
        },
        {
          label: "Server 2",
          urlEnc: encryptSecret(
            "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
          ),
          order: 1,
          active: true,
        },
      ],
    },
    {
      name: "Demo News 24",
      slug: "demo-news-24",
      categoryId: catIds.get("news")!,
      logoUrl: "https://placehold.co/200x200/3b82f6/ffffff/png?text=NEWS",
      description: "Demo news channel using a public test stream.",
      isFeatured: true,
      sources: [
        {
          label: "Server 1",
          urlEnc: encryptSecret(
            "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
          ),
          order: 0,
          active: true,
        },
      ],
    },
    {
      name: "Demo Movies",
      slug: "demo-movies",
      categoryId: catIds.get("movies")!,
      logoUrl: "https://placehold.co/200x200/8b5cf6/ffffff/png?text=MOVIES",
      description: "Demo movie channel using a public test stream.",
      isFeatured: false,
      sources: [
        {
          label: "Server 1",
          urlEnc: encryptSecret(
            "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          ),
          order: 0,
          active: true,
        },
      ],
    },
  ];
  const channelIds = new Map<string, ObjectId>();
  for (const [i, ch] of sampleChannels.entries()) {
    const res = await db.collection("channels").findOneAndUpdate(
      { slug: ch.slug },
      {
        $setOnInsert: {
          ...ch,
          isActive: true,
          order: i,
          viewCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    channelIds.set(ch.slug, res!._id as ObjectId);
  }

  console.log("Seeding sample event...");
  const in30min = new Date(Date.now() + 30 * 60 * 1000);
  await db.collection("events").updateOne(
    { slug: "demo-fc-vs-sample-united" },
    {
      $setOnInsert: {
        title: "Demo FC vs Sample United",
        slug: "demo-fc-vs-sample-united",
        sport: "football",
        league: "Demo Premier League",
        teamA: {
          name: "Demo FC",
          logoUrl: "https://placehold.co/100x100/ef4444/ffffff/png?text=DFC",
        },
        teamB: {
          name: "Sample United",
          logoUrl: "https://placehold.co/100x100/3b82f6/ffffff/png?text=SU",
        },
        startsAt: in30min,
        endsAt: null,
        forcedStatus: null,
        channelIds: [channelIds.get("demo-sports-hd")!],
        isFeatured: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  console.log("Seeding notice...");
  await db.collection("notices").updateOne(
    { text: { $regex: "^Welcome to SportixTV" } },
    {
      $setOnInsert: {
        text: "Welcome to SportixTV — watch live sports & TV in HD. Join our Telegram for updates!",
        isActive: true,
        order: 0,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log("Done.");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
