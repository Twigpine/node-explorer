import { useSearchParams } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { SearchField } from '../components/register/SearchField';
import { useListNav } from '../hooks/useShortcuts';
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS } from '../lib/constants';
import { usePeers } from '../hooks/usePeers';
import { PeerList } from '../components/peers/PeerList';
import { RepoPagination } from '../components/repos/RepoPagination';
import { RepoHero } from '../components/repos/RepoHero';
import { LiveDot } from '../components/brand/Chrome';
import { CopyButton } from '../components/ui/CopyButton';

export default function PeersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawPer = Number(searchParams.get('per'));
  const perPage = PER_PAGE_OPTIONS.includes(rawPer) ? rawPer : DEFAULT_PER_PAGE;

  const setParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        }
        return next;
      }, { replace });
    },
    [setSearchParams],
  );

  const {
    peers, p2p, allCount, reachableCount,
    totalCount, totalPages, windowStart, windowEnd, loading, error,
  } = usePeers({ page, perPage, search });

  const listRef = useRef<HTMLDivElement>(null);
  useListNav(listRef);

  const [searchValue, setSearchValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    const inputFocused =
      typeof document !== 'undefined' && document.activeElement?.id === 'peer-search';
    if (!inputFocused && search !== searchValue) setSearchValue(search);
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

      <RepoHero
        totalCount={totalCount}
        page={page}
        perPage={perPage}
        windowStart={windowStart}
        windowEnd={windowEnd}
        title="Peers"
        countNoun="peers"
        description={
          <p className="m-0">
            Other nodes this node has discovered. Peers announce over HTTP, exchange{' '}
            <code className="font-mono text-[14px] text-foreground">ref-update</code> gossip on
            libp2p, and replicate repositories across the federation. Ping any peer to check it
            live.
          </p>
        }
        cells={[
          { label: 'known peers', value: allCount > 0 ? allCount.toLocaleString() : '—' },
          { label: 'reachable', value: allCount > 0 ? reachableCount.toLocaleString() : '—' },
          { label: 'unreachable', value: allCount > 0 ? (allCount - reachableCount).toLocaleString() : '—' },
          {
            label: 'gossip mesh',
            value: p2p?.enabled
              ? String(p2p.connected_peers ?? p2p.gossipsub_all_peers ?? 0)
              : p2p ? 'off' : '—',
          },
        ]}
      />

      <div className="pt-2 pb-20">

        {/* P2P identity strip */}
        {p2p?.enabled && p2p.peer_id && (
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap border-y border-separator py-2.5 mb-6">
            <span className="flex items-center gap-2 text-[13px] text-foreground">
              <LiveDot on={(p2p.connected_peers ?? 0) > 0} />
              libp2p
            </span>
            <span className="text-[12.5px] text-muted truncate font-mono" title={p2p.peer_id}>
              {p2p.peer_id.slice(0, 12)}…{p2p.peer_id.slice(-8)}
            </span>
            <CopyButton value={p2p.peer_id} label="Copy" srLabel="Copy the libp2p peer id" />
            {(p2p.topics ?? []).map(t => (
              <span key={t} className="font-mono text-[12.5px] text-subtle">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Search */}
        <SearchField
          id="peer-search"
          label="Search peers"
          value={searchValue}
          onChange={v => {
            setSearchValue(v);
            setParams({ q: v, page: null }, true);
          }}
          placeholder="Search by DID or host…"
          className="max-w-[560px] mb-5"
        />

        {error ? (
          <div className="border-t border-border py-14">
            <p className="m-0 text-[14px] text-danger">Failed to load peers: {error}</p>
          </div>
        ) : (
          <>
            <div ref={listRef}>
              <PeerList peers={peers} loading={loading} skeletonCount={Math.min(perPage, 12)} />
            </div>
            <RepoPagination
              page={page}
              totalPages={totalPages}
              perPage={perPage}
              totalCount={totalCount}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onPageChange={p => setParams({ page: p <= 1 ? null : String(p) })}
              onPerPageChange={n => setParams({ per: n === DEFAULT_PER_PAGE ? null : String(n), page: null })}
              noun="peers"
            />
          </>
        )}

      </div>
    </div>
  );
}
