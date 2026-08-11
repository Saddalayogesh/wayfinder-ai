/**
 * Destination imagery.
 *
 * Picks a curated travel photo from the bundled static pool in /public/images
 * (licensed for demo use via Unsplash CDN). Common destination keywords are
 * matched first; anything else falls back to a stable string hash so the same
 * destination always gets the same image.
 *
 * TODO(production): the demo pool is sourced from Unsplash's free CDN. Before
 * shipping, replace with a licensed image provider (e.g. paid Unsplash,
 * Pexels/Shutterstock API) or fully licensed static assets, and add
 * srcset/sizes for bandwidth-conscious responsive loading.
 */

/**
 * Responsive imagery.
 *
 * `frontend/scripts/generate-image-variants.py` emits width variants of every
 * bundled photo into /public/images/resp (capped at each source's native
 * width — never upscaled). `responsiveSrcSet()` maps a static path to its
 * `srcset` string so browsers download only the size they need.
 */

interface PoolImage {
  path: string
  keywords: string[]
}

const IMAGE_POOL: PoolImage[] = [
  { path: '/images/dest-1.jpg', keywords: ['beach', 'island', 'maldives', 'bali', 'hawaii', 'caribbean', 'coast', 'phuket', 'seaside'] },
  { path: '/images/dest-2.jpg', keywords: ['mountain', 'alps', 'himalaya', 'swiss', 'nepal', 'rocky', 'snow', 'everest', 'patagonia', 'banff'] },
  { path: '/images/dest-3.jpg', keywords: ['paris', 'london', 'rome', 'city', 'urban', 'new york', 'barcelona', 'madrid', 'berlin', 'dublin', 'chicago'] },
  { path: '/images/dest-4.jpg', keywords: ['venice', 'amsterdam', 'prague', 'budapest', 'canal', 'vienna', 'florence', 'italy', 'europe', 'lisbon', 'porto'] },
  { path: '/images/dest-5.jpg', keywords: ['forest', 'nature', 'national park', 'rainforest', 'jungle', 'yosemite', 'costa rica', 'canyon'] },
  { path: '/images/dest-6.jpg', keywords: ['desert', 'sahara', 'dubai', 'morocco', 'dune', 'doha', 'cairo', 'jordan', 'abu dhabi'] },
  { path: '/images/dest-7.jpg', keywords: ['santorini', 'greek', 'greece', 'mediterranean', 'aegean', 'mykonos', 'crete', 'turkey'] },
  { path: '/images/dest-8.jpg', keywords: ['japan', 'tokyo', 'kyoto', 'osaka', 'asia', 'thailand', 'bangkok', 'vietnam', 'korea', 'seoul', 'singapore', 'china', 'india'] },
  { path: '/images/dest-9.jpg', keywords: ['lake', 'canoe', 'norway', 'scandinavia', 'fjord', 'sweden', 'finland', 'canada'] },
  { path: '/images/dest-10.jpg', keywords: ['alaska', 'iceland', 'aurora', 'northern lights', 'glacier', 'argentina'] },
]

/** Candidate widths for `srcset`, matching the generated variants. */
const RESP_WIDTHS = [480, 640, 960, 1280, 1600]

/**
 * Native pixel widths of the bundled photos (keyed by file stem). Only
 * variants strictly smaller than this are generated, so the browser never
 * gets handed a srcset entry that 404s. Anything not listed here is 800px
 * wide (the destination pool).
 */
const NATIVE_WIDTHS: Record<string, number> = {
  hero: 1920,
  'auth-resort': 1400,
  'auth-dusk': 1400,
  'auth-mountains': 900,
  'auth-ocean': 900,
}

/** /images/<stem>.jpg → stem (null when the path isn't a local static photo). */
function stemOf(path: string): string | null {
  const match = /^\/images\/([\w-]+)\.\w+$/.exec(path)
  return match ? match[1] : null
}

/**
 * Builds a `srcset` for a bundled static image. Returns '' for remote URLs
 * (e.g. Places photoUrls) — those load as a plain <img src>.
 */
export function responsiveSrcSet(path: string): string {
  const stem = stemOf(path)
  if (!stem) return ''
  const native = NATIVE_WIDTHS[stem] ?? 800
  const widths = RESP_WIDTHS.filter((width) => width < native)
  return widths.map((width) => `/images/resp/${stem}-${width}.jpg ${width}w`).join(', ')
}

/** Small stable string hash so a given destination always maps to one image. */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** Returns a static travel photo for a destination or place name. */
export function destinationImage(label: string): string {
  const text = label.trim().toLowerCase()
  if (!text) return IMAGE_POOL[0].path
  const matched = IMAGE_POOL.find((img) =>
    img.keywords.some((keyword) => text.includes(keyword)),
  )
  if (matched) return matched.path
  return IMAGE_POOL[hashString(text) % IMAGE_POOL.length].path
}
