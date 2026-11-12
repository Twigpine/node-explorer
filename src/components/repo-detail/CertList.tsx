import type { ReactNode } from 'react';
import type { ApiCert } from '../../lib/api';
import { shortDid, shortSha, timeAgo } from '../../lib/api';
import { CopyButton } from '../ui/CopyButton';
import { Brackets } from '../brand/Chrome';
import { cn } from '../../lib/utils';

/**
 * Ref-update certificates.
 *
 * This is the product's strongest evidence: each one is an Ed25519 signature
 * over a ref transition that a reader can check without trusting this node or
 * this page. So a certificate opens as the document it is, every field in
 * full and copyable, with the command that verifies it, rather than as a line
 * of grey metadata.
 *
 * The list stays scannable because each certificate is a disclosure: one
 * ruled summary row, and the full document underneath when opened. The newest
 * is open on arrival and carries the needle.
 */
function Line({
  label,
  copy,
  children,
}: {
  label: string;
  copy?: { value: string; name: string };
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-baseline gap-x-4 border-t border-separator py-2 first:border-t-0 sm:grid-cols-[112px_minmax(0,1fr)_auto]">
      <dt className="text-[12.5px] text-subtle">{label}</dt>
      <dd className="m-0 min-w-0 break-all font-mono text-[12.5px] leading-[1.55] text-foreground">
        {children}
      </dd>
      {copy ? (
        <CopyButton value={copy.value} label="Copy" srLabel={`Copy the ${copy.name}`} className="-my-1" />
      ) : (
        <span />
      )}
    </div>
  );
}

function issuedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

export function CertList({
  items,
  repo,
}: {
  items: ApiCert[];
  /** `<owner-key>/<name>`, the form `gl cert show` accepts for any repository. */
  repo?: string;
}) {
  return (
    <ul className="m-0 list-none border-y border-border p-0">
      {items.map((cert, i) => {
        const created = cert.old_sha.startsWith('0000000');
        const newest = i === 0;
        // The full id, not a prefix: a prefix that matches two certificates is
        // rejected by gl, and this line is meant to be pasted as it stands.
        const verify = `gl cert show ${repo ?? '<repo>'} ${cert.id} --verify`;
        return (
          <li key={cert.id} className="border-t border-separator first:border-t-0">
            <details
              // Opened once, when it first appears as the newest. Driving `open`
              // from `newest` on every render would close a certificate the
              // reader is in the middle of when a newer one arrives.
              ref={el => {
                if (el && newest && !el.dataset.opened) {
                  el.dataset.opened = 'true';
                  el.open = true;
                }
              }}
              className="group"
            >
              <summary
                className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 px-2 py-[10px]
                  transition-colors hover:bg-surface-secondary md:grid-cols-[minmax(0,1.2fr)_170px_100px_84px_64px]
                  [&::-webkit-details-marker]:hidden"
              >
                <span className="flex min-w-0 items-center gap-2 font-mono text-[13px] text-foreground">
                  <span
                    aria-hidden="true"
                    className={cn('h-[7px] w-[7px] shrink-0 rounded-full', newest ? 'bud-in bg-needle' : 'bg-transparent')}
                  />
                  <span className={cn('truncate', newest && 'font-medium')}>{cert.ref_name}</span>
                </span>
                <span className="max-md:hidden font-mono text-[12.5px] text-subtle tabular whitespace-nowrap">
                  {created ? 'new' : shortSha(cert.old_sha)}
                  <span className="px-1.5">&rarr;</span>
                  <span className="text-foreground">{shortSha(cert.new_sha)}</span>
                </span>
                <span className="max-md:hidden truncate font-mono text-[12.5px] text-muted" title={cert.pusher_did}>
                  {shortDid(cert.pusher_did)}
                </span>
                <span title={cert.issued_at} className="font-mono text-[12px] text-subtle tabular whitespace-nowrap md:text-right">
                  {timeAgo(cert.issued_at)}
                </span>
                <span className="text-right text-[12.5px] text-subtle group-open:text-foreground">
                  <span className="group-open:hidden">Open</span>
                  <span className="hidden group-open:inline">Close</span>
                </span>
              </summary>

              <div className="px-2 pb-5 pt-1 sm:pl-[23px]">
                <Brackets className="border border-separator px-4 py-2">
                  <dl className="m-0">
                    <Line label="Certificate" copy={{ value: cert.id, name: 'certificate id' }}>
                      {cert.id}
                    </Line>
                    <Line label="Ref">{cert.ref_name}</Line>
                    <Line label={created ? 'Created at' : 'From'}>
                      {created ? cert.new_sha : cert.old_sha}
                    </Line>
                    {!created && <Line label="To">{cert.new_sha}</Line>}
                    <Line label="Pusher" copy={{ value: cert.pusher_did, name: 'pusher DID' }}>
                      {cert.pusher_did}
                    </Line>
                    <Line label="Issued by" copy={{ value: cert.node_did, name: 'node DID' }}>
                      {cert.node_did}
                    </Line>
                    <Line label="Issued">{issuedAt(cert.issued_at)}</Line>
                    <Line label="Signature" copy={{ value: cert.signature, name: 'signature' }}>
                      <span className="text-muted">{cert.signature}</span>
                    </Line>
                    <Line label="Verify" copy={{ value: verify, name: 'verify command' }}>
                      <span className="select-none text-subtle">$ </span>
                      {verify}
                    </Line>
                  </dl>
                </Brackets>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
