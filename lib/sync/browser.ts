import type { Browser } from "playwright-core";

const CHROMIUM_RELEASE_URL =
  process.env.CHROMIUM_RELEASE_URL ??
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar";

/**
 * Launches a Playwright browser appropriate for the current environment.
 *
 * On Vercel / AWS Lambda: uses @sparticuz/chromium-min which downloads a
 * serverless-compatible Chromium binary to /tmp on cold start.
 *
 * Locally: uses the `playwright` devDependency which bundles its own Chromium.
 * Run `pnpm playwright install chromium` once after installing deps.
 */
export async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    const { default: chromiumBin } = await import("@sparticuz/chromium-min");
    const executablePath = await chromiumBin.executablePath(CHROMIUM_RELEASE_URL);
    return chromium.launch({
      args: chromiumBin.args,
      executablePath,
      headless: true,
    });
  }

  // Local dev — playwright devDep has its own Chromium
  const { chromium: localChrome } = await import("playwright");
  return localChrome.launch({ headless: true });
}
