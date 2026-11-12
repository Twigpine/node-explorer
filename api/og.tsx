import { readFile } from 'node:fs/promises';

import { ImageResponse } from '@vercel/og';
import type { ImageResponseOptions } from '@vercel/og';
import { parse, type OpenTypeFont } from '@shuding/opentype.js';

import {
  buildRepoSocialModel,
  cleanSocialText,
  normalizeRepoOwner,
  type RepoSocialModel,
} from './_lib/repoSocial.js';
import { fetchRepository } from './_lib/repository.js';

const IMMUTABLE_CACHE_CONTROL =
  'public, max-age=31536000, s-maxage=31536000, immutable, no-transform';
const REPOSITORY_CACHE_CONTROL =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400, no-transform';
const FALLBACK_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600, no-transform';

const FONT_FACES = [
  ['Geist', 400],
  ['Geist', 500],
  ['Geist Mono', 400],
  ['Geist Mono', 500],
] as const;

// One per face above, in the same order. Literal `new URL(..., import.meta.url)`
// calls: Vercel's
// function tracer follows these to bundle the font files, and it cannot follow
// a path built at runtime.
const fontUrls = [
  new URL('../node_modules/@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf', import.meta.url),
  new URL('../node_modules/@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf', import.meta.url),
  new URL('../node_modules/@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf', import.meta.url),
  new URL('../node_modules/@expo-google-fonts/geist-mono/500Medium/GeistMono_500Medium.ttf', import.meta.url),
];

type OgFonts = NonNullable<ImageResponseOptions['fonts']>;

interface FontAssets {
  fonts: OgFonts;
  /** Geist Mono regular: the face the repository name and branch are set in. */
  regular: OpenTypeFont;
}

function exactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

// Start the reads at module initialization so concurrent requests share the
// same work. TTF is intentional: Satori cannot render WOFF2 font data.
const fontAssetsPromise: Promise<FontAssets> = Promise.all(
  fontUrls.map(url => readFile(url)),
).then(files => {
  const data = files.map(exactArrayBuffer);
  return {
    fonts: FONT_FACES.map(([name, weight], index) => ({
      name,
      data: data[index],
      style: 'normal' as const,
      weight,
    })),
    regular: parse(data[2]),
  };
});

function sanitizeForFont(value: string, font: OpenTypeFont): string {
  const segments = typeof Intl.Segmenter === 'function'
    ? Array.from(
        new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
        part => part.segment,
      )
    : Array.from(value);

  let missingRun = false;
  const output: string[] = [];

  for (const segment of segments) {
    if (Array.from(segment).every(character => font.charToGlyphIndex(character) > 0)) {
      output.push(segment);
      missingRun = false;
      continue;
    }

    const asciiFallback = segment.normalize('NFKD')
      .replace(/\p{Mark}/gu, '')
      .replace(/[^\x20-\x7E]/g, '');
    if (asciiFallback) {
      output.push(asciiFallback);
      missingRun = false;
    } else if (!missingRun) {
      output.push('?');
      missingRun = true;
    }
  }

  return output.join('');
}

function sanitizeModelForFont(model: RepoSocialModel, font: OpenTypeFont): RepoSocialModel {
  return {
    ...model,
    branch: sanitizeForFont(model.branch, font),
    description: sanitizeForFont(model.description, font),
    name: sanitizeForFont(model.name, font),
  };
}

interface RepositoryQuery {
  name: string;
  owner: string;
  version: string;
}

function parseRepositoryQuery(request: Request): RepositoryQuery | null {
  const search = new URL(request.url).searchParams;
  const rawOwner = search.get('owner');
  const rawName = search.get('name');

  if (!rawOwner || !rawName) return null;
  if (Array.from(rawOwner).length > 512 || Array.from(rawName).length > 256) return null;

  const owner = normalizeRepoOwner(rawOwner).canonicalSegment;
  const name = cleanSocialText(rawName, 256);
  if (!owner || !name) return null;

  return {
    name,
    owner,
    version: cleanSocialText(search.get('v'), 160),
  };
}

function cacheControl(model: RepoSocialModel | null, version: string): string {
  if (!model) return FALLBACK_CACHE_CONTROL;
  if (version && version === model.cacheVersion) return IMMUTABLE_CACHE_CONTROL;
  return REPOSITORY_CACHE_CONTROL;
}

/**
 * Render one public repository preview. Missing, private, malformed, and
 * upstream-error requests intentionally collapse to the same generic card so
 * private repository metadata is never disclosed through image generation.
 */
export async function GET(request: Request): Promise<Response> {
  const query = parseRepositoryQuery(request);
  let model: RepoSocialModel | null = null;

  if (query) {
    try {
      const result = await fetchRepository(query.owner, query.name, request.signal);
      if (result.status === 'ok' && result.repository.is_public) {
        model = buildRepoSocialModel(result.repository);
      }
    } catch {
      // Image crawlers should always receive a valid branded PNG, even if an
      // unexpected model or renderer input failure occurs upstream.
      model = null;
    }
  }

  const fontAssets = await fontAssetsPromise;
  const renderModel = model ? sanitizeModelForFont(model, fontAssets.regular) : null;
  const variant = model ? 'repository' : 'generic';
  const headers = {
    // Lower-case keys replace @vercel/og's defaults instead of being folded
    // into duplicate comma-separated values by the Headers constructor.
    'cache-control': cacheControl(model, query?.version ?? ''),
    'content-type': 'image/png',
    'x-content-type-options': 'nosniff',
    'x-gitlawb-og-variant': variant,
  };

  return new ImageResponse(
    renderModel ? <RepositoryOgCard model={renderModel} /> : <GenericOgCard />,
    {
      fonts: fontAssets.fonts,
      headers,
      height: OG_HEIGHT,
      width: OG_WIDTH,
    },
  );
}

// ── OG card layout (formerly api/_lib/og-layout.tsx) ─────────────────────────
// Inlined into the entrypoint: Vercel's function tracer maps .js import
// specifiers to .ts sources but not .tsx, so a .tsx module imported across
// files is silently dropped from the bundle (ERR_MODULE_NOT_FOUND at runtime).
// Entrypoint .tsx files compile fine — so the layout lives here.
import type { CSSProperties, ReactElement, ReactNode } from 'react';


export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Canopy, the Twigpine theme: paper, one ink at a few opacities, and the
// needle, which appears once, as the bud on the mark.
const colors = {
  paper: '#ffffff',
  ink: '#0c1210',
  ink2: 'rgba(12, 18, 16, 0.72)',
  ink3: 'rgba(12, 18, 16, 0.62)',
  ink4: 'rgba(12, 18, 16, 0.48)',
  rule: 'rgba(12, 18, 16, 0.12)',
  rule2: 'rgba(12, 18, 16, 0.22)',
  grid: 'rgba(12, 18, 16, 0.045)',
  needle: '#0b7a48',
};

const SANS = 'Geist';
const MONO = 'Geist Mono';

const verticalGridLines = Array.from({ length: Math.ceil(OG_WIDTH / 80) - 1 }, (_, index) =>
  (index + 1) * 80,
);
const horizontalGridLines = Array.from({ length: Math.ceil(OG_HEIGHT / 80) - 1 }, (_, index) =>
  (index + 1) * 80,
);

const labelStyle: CSSProperties = {
  color: colors.ink3,
  fontFamily: SANS,
  fontSize: 15,
  lineHeight: 1,
};

function truncateEnd(value: string, limit: number): string {
  const characters = Array.from(value);
  if (characters.length <= limit) return value;
  return `${characters.slice(0, Math.max(1, limit - 1)).join('')}…`;
}

function truncateMiddle(value: string, start = 10, end = 5): string {
  const characters = Array.from(value);
  if (characters.length <= start + end + 1) return value;
  return `${characters.slice(0, start).join('')}…${characters.slice(-end).join('')}`;
}

function graphemes(value: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), part => part.segment);
  }
  return Array.from(value);
}

function graphemeUnits(value: string): number {
  const codePoint = value.codePointAt(0) ?? 0;
  // CJK, emoji, and most astral glyphs occupy roughly two mono cells.
  return codePoint >= 0x1100 ? 2 : 1;
}

function textUnits(value: string): number {
  return graphemes(value).reduce((total, grapheme) => total + graphemeUnits(grapheme), 0);
}

/**
 * Satori's CSS line-clamp can generate clipping masks that affect unrelated
 * SVG layers. Fit the two lines explicitly so every card is deterministic.
 */
function fitLines(value: string, maxUnits: number, maxLines: number): string[] {
  let remaining = graphemes(value.trim());
  const lines: string[] = [];

  for (let lineIndex = 0; lineIndex < maxLines && remaining.length > 0; lineIndex += 1) {
    const isLastLine = lineIndex === maxLines - 1;
    const availableUnits = isLastLine ? Math.max(1, maxUnits - 1) : maxUnits;
    let usedUnits = 0;
    let cut = 0;

    while (cut < remaining.length) {
      const nextUnits = graphemeUnits(remaining[cut]);
      if (usedUnits + nextUnits > availableUnits) break;
      usedUnits += nextUnits;
      cut += 1;
    }

    if (cut === remaining.length) {
      lines.push(remaining.join('').trim());
      break;
    }

    if (!isLastLine) {
      const minimumBreak = Math.floor(cut * 0.55);
      for (let index = cut - 1; index >= minimumBreak; index -= 1) {
        if (remaining[index] === ' ' || remaining[index] === '-') {
          cut = index + 1;
          break;
        }
      }
    }

    const line = remaining.slice(0, Math.max(1, cut)).join('').trim();
    lines.push(isLastLine ? `${line}…` : line);
    remaining = remaining.slice(Math.max(1, cut));
    while (remaining[0] === ' ') remaining.shift();
  }

  return lines.length ? lines : ['—'];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date);
}

function formatStars(value: number): string {
  if (value < 1_000) return String(value);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value);
}

function nameFontSize(value: string): number {
  const length = textUnits(value);
  if (length <= 18) return 68;
  if (length <= 30) return 56;
  if (length <= 46) return 48;
  if (length <= 64) return 41;
  return 36;
}

function GridLines(): ReactElement {
  return (
    <div
      style={{
        bottom: 0,
        display: 'flex',
        left: 0,
        overflow: 'hidden',
        position: 'absolute',
        right: 0,
        top: 0,
      }}
    >
      {verticalGridLines.map(position => (
        <div
          key={`v-${position}`}
          style={{
            backgroundColor: colors.grid,
            bottom: 0,
            left: position,
            position: 'absolute',
            top: 0,
            width: 1,
          }}
        />
      ))}
      {horizontalGridLines.map(position => (
        <div
          key={`h-${position}`}
          style={{
            backgroundColor: colors.grid,
            height: 1,
            left: 0,
            position: 'absolute',
            right: 0,
            top: position,
          }}
        />
      ))}
    </div>
  );
}

/** The Pine mark: stem, three tiers, and the bud in the needle. */
function PineMark({ size = 38 }: { size?: number }): ReactElement {
  return (
    <svg aria-hidden="true" height={size} viewBox="0 0 32 32" width={size}>
      <g
        fill="none"
        stroke={colors.ink}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      >
        <path d="M16 29.5V9" />
        <path d="M10 15.5l6-5.5 6 5.5M8 21.5l8-6.5 8 6.5M6.5 27.5l9.5-7 9.5 7" />
      </g>
      <circle cx="16" cy="5.2" fill={colors.needle} r="3" stroke={colors.ink} strokeWidth="1.6" />
    </svg>
  );
}

function Header({ note }: { note: string }): ReactElement {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row',
        flexShrink: 0,
        height: 44,
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
        <PineMark />
        <div
          style={{
            color: colors.ink,
            display: 'flex',
            fontFamily: SANS,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '-0.03em',
            marginLeft: 12,
          }}
        >
          twigpine
        </div>
        <div
          style={{
            color: colors.ink3,
            display: 'flex',
            fontFamily: SANS,
            fontSize: 24,
            marginLeft: 10,
          }}
        >
          / explorer
        </div>
      </div>
      <div style={{ color: colors.ink3, display: 'flex', fontFamily: MONO, fontSize: 16 }}>
        {note}
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        alignItems: 'center',
        border: `1px solid ${colors.rule2}`,
        color: colors.ink2,
        display: 'flex',
        fontFamily: MONO,
        fontSize: 16,
        height: 32,
        padding: '0 11px',
      }}
    >
      {children}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  width: string;
  mono?: boolean;
}

function Stat({ label, value, width, mono = false }: StatProps): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width }}>
      <div style={labelStyle}>{label}</div>
      <div
        style={{
          color: colors.ink,
          display: 'flex',
          fontFamily: mono ? MONO : SANS,
          fontSize: 19,
          lineHeight: 1.2,
          marginTop: 9,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/** One corner bracket of the instrument frame. */
function Corner({ x, y }: { x: 'left' | 'right'; y: 'top' | 'bottom' }): ReactElement {
  const side = `2px solid ${colors.ink}`;
  return (
    <div
      style={{
        [x]: 28,
        [y]: 28,
        borderBottom: y === 'bottom' ? side : 'none',
        borderLeft: x === 'left' ? side : 'none',
        borderRight: x === 'right' ? side : 'none',
        borderTop: y === 'top' ? side : 'none',
        display: 'flex',
        height: 18,
        position: 'absolute',
        width: 18,
      }}
    />
  );
}

function Frame({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        backgroundColor: colors.paper,
        color: colors.ink,
        display: 'flex',
        fontFamily: SANS,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <GridLines />
      <Corner x="left" y="top" />
      <Corner x="right" y="top" />
      <Corner x="left" y="bottom" />
      <Corner x="right" y="bottom" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '56px 64px 50px',
          position: 'relative',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function RepositoryOgCard({ model }: { model: RepoSocialModel }): ReactElement {
  const owner = truncateMiddle(model.owner.key || model.owner.display, 10, 5);
  const fontSize = nameFontSize(model.name);
  const nameLines = fitLines(model.name, Math.floor(1000 / (fontSize * 0.62)), 2);
  const descriptionLines = fitLines(model.description, 86, 2);

  return (
    <Frame>
      <Header note="Repository" />
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          marginTop: 36,
          minHeight: 0,
        }}
      >
        <div
          style={{
            color: colors.ink4,
            display: 'flex',
            fontFamily: MONO,
            fontSize: 24,
            lineHeight: 1,
          }}
        >
          {model.owner.display || 'unknown'}/
        </div>
        <div
          style={{
            color: colors.ink,
            display: 'flex',
            flexDirection: 'column',
            marginTop: 10,
            maxWidth: 1040,
          }}
        >
          {nameLines.map((line, index) => (
            <div
              key={`${index}-${line}`}
              style={{
                color: colors.ink,
                display: 'flex',
                fontFamily: MONO,
                fontSize,
                fontWeight: 500,
                letterSpacing: '-0.04em',
                lineHeight: 1.06,
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            color: colors.ink2,
            display: 'flex',
            flexDirection: 'column',
            marginTop: 18,
            maxWidth: 1010,
          }}
        >
          {descriptionLines.map((line, index) => (
            <div
              key={`${index}-${line}`}
              style={{
                color: colors.ink2,
                display: 'flex',
                fontFamily: SANS,
                fontSize: 24,
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
            gap: 9,
            marginTop: 22,
          }}
        >
          <Tag>{truncateEnd(model.branch, 28)}</Tag>
          <Tag>{model.visibility}</Tag>
          {model.isFork ? <Tag>fork</Tag> : null}
        </div>
      </div>
      <div
        style={{
          borderTop: `1px solid ${colors.rule2}`,
          display: 'flex',
          flexDirection: 'row',
          height: 76,
          paddingTop: 18,
          width: '100%',
        }}
      >
        <Stat label="Owner" value={owner || 'Unknown'} width="36%" mono />
        <Stat label="Updated" value={formatDate(model.updatedAt)} width="24%" />
        <Stat label="Created" value={formatDate(model.createdAt)} width="24%" />
        <Stat label="Stars" value={formatStars(model.stars)} width="16%" />
      </div>
    </Frame>
  );
}

/**
 * A card that states one thing in two tones: the claim in ink, the second
 * sentence dimmer. Used for the generic fallback here and to draw the static
 * images in public/ (og.png, og-docs.png).
 */
export function StatementOgCard({
  note,
  claim,
  second,
  footer,
}: {
  note: string;
  claim: string;
  second: string;
  footer: string;
}): ReactElement {
  const headline: CSSProperties = {
    display: 'flex',
    fontFamily: SANS,
    fontSize: 70,
    fontWeight: 500,
    letterSpacing: '-0.04em',
    lineHeight: 1.04,
  };
  return (
    <Frame>
      <Header note={note} />
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 1040,
          paddingBottom: 12,
        }}
      >
        <div style={{ ...headline, color: colors.ink }}>{claim}</div>
        <div style={{ ...headline, color: colors.ink4, marginTop: 6 }}>{second}</div>
      </div>
      <div
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${colors.rule2}`,
          color: colors.ink3,
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          fontFamily: SANS,
          fontSize: 20,
          height: 54,
          paddingTop: 16,
          width: '100%',
        }}
      >
        {footer}
      </div>
    </Frame>
  );
}

export function GenericOgCard(): ReactElement {
  return (
    <StatementOgCard
      note="explorer.twigpine.com"
      claim="Every push is signed by the key that made it."
      second="Check any of them yourself."
      footer="Browse repositories, inspect history, and verify push certificates."
    />
  );
}

/** Font data for callers that render a card outside the request handler. */
export async function ogFonts(): Promise<OgFonts> {
  return (await fontAssetsPromise).fonts;
}
