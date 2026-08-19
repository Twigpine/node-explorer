import { useState } from 'react';
import { Button } from '../register/controls';
import { cn } from '../../lib/utils';
import type { ApiPeer } from '../../lib/api';
import { pingPeer, peerHost, isHttpUrl, shortDid, timeAgo } from '../../lib/api';
import { LiveDot } from '../brand/Chrome';
import { CopyValue } from '../ui/CopyValue';
import { Skeleton } from '../ui/Skeleton';
import { Pill } from '../ui/Pill';

type PingState =
  | { kind: 'idle' }
  | { kind: 'pinging' }
  | { kind: 'done'; ok: boolean; ms: number };

function PingCell({ did }: { did: string }) {
  const [state, setState] = useState<PingState>({ kind: 'idle' });

  const ping = async () => {
    setState({ kind: 'pinging' });
    const started = performance.now();
    try {
      const ok = await pingPeer(did);
      setState({ kind: 'done', ok, ms: Math.round(performance.now() - started) });
    } catch {
      setState({ kind: 'done', ok: false, ms: Math.round(performance.now() - started) });
    }
  };

  if (state.kind === 'done') {
    return (
      <Button
        variant="tertiary"
        size="sm"
        onPress={ping}
        aria-label="Ping again"
        className={cn(
          'font-mono text-[12px] tabular-nums h-auto min-h-0 px-1 py-0 text-right',
          state.ok ? 'text-foreground' : 'text-danger',
        )}
      >
        {state.ok ? `${state.ms} ms` : 'No reply'}
      </Button>
    );
  }
  return (
    <Pill onClick={ping} disabled={state.kind === 'pinging'} aria-label={`Ping peer ${shortDid(did)}`} className="rounded-[var(--radius-control)] px-2">
      {state.kind === 'pinging' ? 'Pinging…' : 'Ping'}
    </Pill>
  );
}

function PeerRow({ peer, index }: { peer: ApiPeer; index: number }) {
  // Gossiped by other nodes, not this app — a `javascript:` http_url must not
  // reach an anchor href.
  const safeUrl = isHttpUrl(peer.http_url) ? peer.http_url : undefined;

  return (
    <li
      className="grid grid-cols-[16px_minmax(0,1fr)_70px] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_120px_90px]
        items-center gap-x-3 md:gap-x-4 px-2 py-[9px]
        border-b border-separator last:border-b-0 hover:bg-surface-secondary transition-colors"
      style={{ animationDelay: `${index * 16}ms` }}
    >
      <span title={peer.reachable ? 'Reachable' : 'Unreachable'} className="flex">
        <LiveDot on={peer.reachable} />
        <span className="sr-only">{peer.reachable ? 'Reachable' : 'Unreachable'}</span>
      </span>

      {/* Identity */}
      <div className="flex items-center gap-2 min-w-0">
        <CopyValue value={peer.did} name="peer DID" className="truncate text-[13px] font-medium text-foreground">
          {shortDid(peer.did)}
        </CopyValue>
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden font-mono text-[12px] text-subtle truncate"
          >
            {peerHost(peer.http_url)}
          </a>
        ) : (
          <span className="md:hidden font-mono text-[12px] text-subtle truncate" title="Rejected URL scheme">
            {peerHost(peer.http_url)}
          </span>
        )}
      </div>

      {/* Host */}
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block font-mono text-[12.5px] text-muted truncate hover:text-foreground"
        >
          {peerHost(peer.http_url)} ↗
        </a>
      ) : (
        <span className="hidden md:block font-mono text-[12.5px] text-muted truncate" title="Rejected URL scheme">
          {peerHost(peer.http_url)}
        </span>
      )}

      {/* Last seen */}
      <span className="hidden md:block font-mono text-[12px] text-subtle tabular-nums whitespace-nowrap">
        {peer.last_seen ? timeAgo(peer.last_seen) : 'never'}
      </span>

      {/* Ping */}
      <span className="justify-self-end">
        <PingCell did={peer.did} />
      </span>
    </li>
  );
}

function PeerRowSkeleton() {
  return (
    <li className="grid grid-cols-[16px_minmax(0,1fr)_70px] md:grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_120px_90px]
      items-center gap-x-3 md:gap-x-4 px-2 py-[9px] border-b border-separator last:border-b-0">
      <span />
      <Skeleton className="h-4 w-40 max-w-full" />
      <Skeleton className="hidden md:block h-4 w-36" />
      <Skeleton className="hidden md:block h-4 w-16" />
      <Skeleton className="h-6 w-14 justify-self-end" />
    </li>
  );
}

interface PeerListProps {
  peers: ApiPeer[] | null;
  loading?: boolean;
  skeletonCount?: number;
}

export function PeerList({ peers, loading = false, skeletonCount = 10 }: PeerListProps) {
  return (
    <div className={cn(
      'transition-opacity duration-200',
      loading && peers !== null && 'opacity-40 pointer-events-none',
    )}>
      <div className="hidden md:grid grid-cols-[24px_minmax(0,4fr)_minmax(0,3fr)_120px_90px] gap-x-4 px-2 h-9 items-center border-b border-border">
        <span />
        <span className="text-[12.5px] text-subtle">Peer</span>
        <span className="text-[12.5px] text-subtle">Endpoint</span>
        <span className="text-[12.5px] text-subtle">Last seen</span>
        <span className="text-right text-[12.5px] text-subtle">Check</span>
      </div>

      {peers === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading peers">
          {Array.from({ length: skeletonCount }, (_, i) => <PeerRowSkeleton key={i} />)}
        </ul>
      ) : peers.length === 0 ? (
        <p className="m-0 py-14 text-[14px] text-muted">No peers match.</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {peers.map((peer, i) => <PeerRow key={peer.did} peer={peer} index={i} />)}
        </ul>
      )}
    </div>
  );
}
