import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The Content-Security-Policy in vercel.json allows the page's one inline
 * script by its sha256 hash. The two live in different files, and a mismatch
 * does not fail the build: the browser blocks the script and the page loads
 * without it. These tests are the link between them.
 */
const root = new URL('../../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const vercel = JSON.parse(readFileSync(new URL('vercel.json', root), 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};

const everyRoute = vercel.headers.find(entry => entry.source === '/(.*)');
const header = (name: string) =>
  everyRoute?.headers.find(h => h.key.toLowerCase() === name.toLowerCase())?.value ?? '';

const csp = header('Content-Security-Policy');
const directive = (name: string) =>
  csp
    .split(';')
    .map(part => part.trim().split(/\s+/))
    .find(([key]) => key === name)
    ?.slice(1) ?? [];

/** Inline scripts: a <script> with no src attribute. */
const inlineScripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)).map(
  match => match[1],
);

describe('Content-Security-Policy', () => {
  it('lists the hash of every inline script in index.html', () => {
    expect(inlineScripts.length).toBeGreaterThan(0);
    const scriptSrc = directive('script-src');
    for (const script of inlineScripts) {
      const hash = `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
      expect(scriptSrc, `add ${hash} to script-src in vercel.json`).toContain(hash);
    }
  });

  it('does not allow inline or evaluated script', () => {
    const scriptSrc = directive('script-src');
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc.some(source => source === '*' || source === 'https:' || source === 'data:')).toBe(false);
  });

  it('keeps fetches on this origin: every node is reached through a same-origin prefix', () => {
    expect(directive('connect-src')).toEqual(["'self'"]);
  });

  it('forbids framing, plugins and a foreign base', () => {
    expect(directive('frame-ancestors')).toEqual(["'none'"]);
    expect(directive('object-src')).toEqual(["'none'"]);
    expect(directive('base-uri')).toEqual(["'self'"]);
    expect(header('X-Frame-Options')).toBe('DENY');
    expect(header('X-Content-Type-Options')).toBe('nosniff');
  });
});
