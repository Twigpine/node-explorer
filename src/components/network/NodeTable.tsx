import { ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { NodeSnapshot } from '../../lib/nodes';
import type { ReplicationStatus } from '../../lib/replication';
import { truncateDid } from '../../lib/api';
import { CopyValue } from '../ui/CopyValue';
import { Skeleton } from '../ui/Skeleton';
import { LiveDot } from '../brand/Chrome';

/**
 * The federation's nodes, as one ruled table.
 *
 * Every cell is something the node itself returned a moment ago. The last
 * column is the only derived one: of the ref updates seen anywhere in the
 * federation, how many this node has not received yet, drawn as an ink bar
 * against the total so the nodes can be compared at a glance.
 */
const GRID =
  'grid items-center gap-x-5 px-2 ' +
  'grid-cols-[minmax(0,1fr)_auto] ' +
  'md:grid-cols-[minmax(0,1.5fr)_70px_70px_80px_minmax(0,1fr)] ' +
  'xl:grid-cols-[minmax(0,1.4fr)_64px_minmax(0,1fr)_70px_70px_80px_110px_minmax(0,1fr)]';

const num = 'text-right font-mono text-[13px] tabular text-foreground';
const th = 'text-[12.5px] text-subtle';

function n(value: number | undefined | null): string {
  return typeof value === 'number' ? value.toLocaleString() : '—';
}

export function NodeTable({
  snapshots,
  replication,
  skeletonCount,
}: {
  snapshots: NodeSnapshot[] | null;
  replication: ReplicationStatus | null;
  skeletonCount: number;
}) {
  return (
    <div role="table" aria-label="Federation nodes">
      <div role="row" className={cn(GRID, 'pb-2')}>
        <span role="columnheader" className={cn(th, 'pl-[15px]')}>Node</span>
        <span role="columnheader" className={cn(th, 'max-xl:hidden')}>Version</span>
        <span role="columnheader" className={cn(th, 'max-xl:hidden')}>Identity</span>
        <span role="columnheader" className={cn(th, 'max-md:hidden text-right')}>Repos</span>
        <span role="columnheader" className={cn(th, 'max-md:hidden text-right')}>Agents</span>
        <span role="columnheader" className={cn(th, 'max-md:hidden text-right')}>Pushes</span>
        <span role="columnheader" className={cn(th, 'max-xl:hidden')}>libp2p</span>
        <span role="columnheader" className={cn(th, 'max-md:text-right')}>Updates behind</span>
      </div>

      <div role="rowgroup" className="border-y border-border">
        {snapshots === null
          ? Array.from({ length: skeletonCount }, (_, i) => (
              <div key={i} role="row" className="border-t border-separator px-2 py-[13px] first:border-t-0">
                <span role="cell" className="block">
                  <Skeleton className="h-4 w-full" />
                </span>
              </div>
            ))
          : snapshots.map(({ node, reachable, info, stats, peers, p2p, events }) => {
              const behind = replication?.driftByNode[node.label];
              const total = replication?.totalTuples ?? 0;
              const share = typeof behind === 'number' && total > 0 ? behind / total : null;
              return (
                <div
                  key={node.id}
                  role="row"
                  className={cn(GRID, 'border-t border-separator py-[11px] first:border-t-0')}
                >
                  <span role="cell" className="flex min-w-0 items-center gap-2">
                    <LiveDot on={reachable} />
                    <a
                      href={node.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[13px] font-medium text-foreground hover:underline"
                    >
                      <span className="truncate">{node.label}</span>
                      <ExternalLink size={11} className="shrink-0 text-subtle" aria-hidden="true" />
                    </a>
                    {!reachable && <span className="shrink-0 text-[12.5px] text-danger">Unreachable</span>}
                  </span>

                  <span role="cell" className="max-xl:hidden font-mono text-[12.5px] text-muted">
                    {info?.version ? `v${info.version}` : '—'}
                  </span>

                  <span role="cell" className="max-xl:hidden min-w-0 truncate font-mono text-[12.5px] text-muted">
                    {info?.did ? (
                      <CopyValue value={info.did} name="node DID">
                        {truncateDid(info.did)}
                      </CopyValue>
                    ) : (
                      '—'
                    )}
                  </span>

                  <span role="cell" className={cn(num, 'max-md:hidden')}>{n(stats?.repos)}</span>
                  <span role="cell" className={cn(num, 'max-md:hidden')}>{n(stats?.agents)}</span>
                  <span role="cell" className={cn(num, 'max-md:hidden')}>{n(stats?.pushes)}</span>

                  <span role="cell" className="max-xl:hidden font-mono text-[12.5px] text-muted tabular whitespace-nowrap">
                    {p2p?.enabled
                      ? `${p2p.connected_peers ?? 0} up · ${peers?.length ?? 0} known`
                      : p2p
                        ? 'off'
                        : '—'}
                  </span>

                  <span role="cell" className="flex min-w-0 items-center gap-3 max-md:justify-end">
                    {events === null || typeof behind !== 'number' ? (
                      <span className="text-[12.5px] text-subtle">No feed</span>
                    ) : (
                      <>
                        <span className="w-[34px] shrink-0 text-right font-mono text-[13px] tabular text-foreground">
                          {behind}
                        </span>
                        <span
                          aria-hidden="true"
                          className="max-md:hidden block h-1.5 min-w-0 flex-1 bg-surface-secondary"
                        >
                          <span
                            className="block h-full bg-foreground"
                            style={{ width: `${Math.round((share ?? 0) * 100)}%` }}
                          />
                        </span>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
      </div>

      {replication && (
        <p className="m-0 mt-2.5 px-2 text-[12.5px] text-subtle">
          Updates behind is counted against the {replication.totalTuples.toLocaleString()} distinct ref
          updates seen across every node&rsquo;s latest feed.
        </p>
      )}
    </div>
  );
}
