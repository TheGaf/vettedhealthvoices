import { prisma } from '../src/lib/prisma';

type FeedType = 'rss' | 'atom' | 'json' | 'sitemap';

type IngestStats = {
  feeds: number;
  fetched: number;
  createdItems: number;
  skippedBlocked: number;
  skippedDuplicate: number;
  errors: number;
};

function stripUtms(u: URL) {
  const utmParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
  ];
  for (const p of utmParams) u.searchParams.delete(p);
}

function canonicalizeUrl(raw: string): string {
  const url = new URL(raw);
  url.hash = '';
  stripUtms(url);
  // normalize trailing slash (keep root)
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
  return url.toString();
}

async function safeResolveRedirect(url: string): Promise<string> {
  // Only do a HEAD-follow for http(s). Avoid download-heavy content.
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return url;

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'user-agent': 'HealthTrustDirectoryMVP/0.1 (+ingest)' },
    });
    const finalUrl = res.url || url;
    return finalUrl;
  } catch {
    return url;
  }
}

function extractText(htmlOrText: string): string {
  // Minimal sanitizer: remove tags.
  return htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(text: string, max = 280) {
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, max - 1) + '…';
}

async function isBlockedByDomain(host: string): Promise<boolean> {
  const entry = await prisma.domainBlocklist.findUnique({ where: { host } });
  return !!entry;
}

async function isBlockedByKeyword(text: string): Promise<boolean> {
  const keywords = await prisma.keywordBlocklist.findMany();
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.keyword.toLowerCase()));
}

async function ingestFeed(feedId: string, type: FeedType, url: string, creatorId: string, stats: IngestStats) {
  stats.fetched += 1;
  const run = await prisma.ingestRun.create({ data: { feedId, status: 'ok', statsJson: '{}' } });
  const started = Date.now();

  try {
    const res = await fetch(url, { headers: { 'user-agent': 'HealthTrustDirectoryMVP/0.1 (+ingest)' } });
    if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`);
    const body = await res.text();

    let entries: Array<{ title: string; url: string; publishedAt?: string; content?: string }> = [];

    if (type === 'sitemap') {
      // very small sitemap parser
      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]);
      entries = locs.slice(0, 2000).map((l) => ({ title: l, url: l }));
    } else if (type === 'json') {
      const json = JSON.parse(body);
      const items = json.items || json;
      if (Array.isArray(items)) {
        entries = items
          .map((it: any) => ({
            title: String(it.title ?? it.url ?? ''),
            url: String(it.url ?? it.external_url ?? it.link ?? ''),
            publishedAt: it.date_published || it.published || it.date,
            content: it.content_text || it.content_html || it.summary || '',
          }))
          .filter((e) => e.url);
      }
    } else {
      // rss/atom: minimal link+title extraction
      const itemBlocks = [...body.matchAll(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi)].map((m) => m[0]);
      entries = itemBlocks
        .slice(0, 2000)
        .map((blk) => {
          const title = (blk.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
          const link1 = blk.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim();
          const link2 = blk.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]?.trim();
          const link = link1 || link2 || '';
          const pub =
            blk.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ||
            blk.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1]?.trim() ||
            blk.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]?.trim();
          const content =
            blk.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ||
            blk.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1] ||
            blk.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ||
            '';
          return { title: extractText(title), url: link, publishedAt: pub, content };
        })
        .filter((e) => e.url);
    }

    for (const e of entries) {
      const resolved = await safeResolveRedirect(e.url);
      const canonicalUrl = canonicalizeUrl(resolved);
      const host = new URL(canonicalUrl).host;

      const combinedText = `${e.title} ${e.url} ${extractText(e.content ?? '')}`;

      if (await isBlockedByDomain(host)) {
        stats.skippedBlocked += 1;
        continue;
      }
      if (await isBlockedByKeyword(combinedText)) {
        stats.skippedBlocked += 1;
        continue;
      }

      const existing = await prisma.item.findUnique({ where: { canonicalUrl } });
      if (existing) {
        stats.skippedDuplicate += 1;
        continue;
      }

      const contentText = extractText(e.content ?? '');
      const ex = excerpt(contentText || e.title);

      await prisma.item.create({
        data: {
          creatorId,
          feedId,
          title: e.title || canonicalUrl,
          url: e.url,
          canonicalUrl,
          contentText: contentText || null,
          excerpt: ex || null,
          publishedAt: e.publishedAt ? new Date(e.publishedAt) : null,
        },
      });
      stats.createdItems += 1;
    }

    const endedAt = new Date();
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        endedAt,
        status: 'ok',
        statsJson: JSON.stringify({ entries: entries.length, durationMs: Date.now() - started }),
      },
    });

    await prisma.feed.update({ where: { id: feedId }, data: { lastFetched: endedAt } });
  } catch (err: any) {
    stats.errors += 1;
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { endedAt: new Date(), status: 'error', error: String(err?.message ?? err) },
    });
  }
}

async function main() {
  const feeds = await prisma.feed.findMany({ where: { enabled: true }, include: { creator: true } });
  const stats: IngestStats = {
    feeds: feeds.length,
    fetched: 0,
    createdItems: 0,
    skippedBlocked: 0,
    skippedDuplicate: 0,
    errors: 0,
  };

  for (const f of feeds) {
    await ingestFeed(f.id, f.type as FeedType, f.url, f.creatorId, stats);
  }

  console.log('Ingest done', stats);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
