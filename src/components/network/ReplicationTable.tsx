import { cn } from '../../lib/utils';
import type { ReplicationStatus, Presence } from '../../lib/replication';
import { parseEventRepo, shortDid, shortRefName, shortSha, timeAgo } from '../../lib/api';
import { CopyValue } from '../ui/CopyValue';

/**
 * Which node holds which ref update.
 *
 * Three states, told apart by shape as well as weight so the matrix reads in
 * one ink: a filled square is the node that received the push, a filled dot
 * is a node that got it by gossip, a hollow dot is a node that has not.
 */
const PRESENCE: Record<Presence, { title: string; cls: string }> = {
  origin: { title: 'Origin: received the push', cls: 'bg-foreground' },
  replicated: { title: 'Replicated by gossip', cls: 'rounded-full bg-muted' },
  missing: { title: 'Not replicated yet', cls: 'rounded-full border border-faint' },
};

function Mark({ presence }: { presence: Presence }) {
  return <span aria-hidden="true" className={cn('inline-block h-2 w-2', PRESENCE[presence].cls)} />;
}

interface ReplicationTableProps {
  replication: ReplicationStatus;
  /** Node labels in display order (columns). */
  labels: string[];
  rowLimit?: number;
}

export function ReplicationTable({ replication, labels, rowLimit = 12 }: ReplicationTableProps) {
  const rows = replication.rows.slice(0, rowLimit);
  const short = (label: string) => label.split('.')[0];
  const cols = { gridTemplateColumns: `76px minmax(0,1fr) 84px repeat(${labels.length}, 72px)` };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-2">
        <h2 className="m-0 text-[17px] font-[540] tracking-[-0.015em] text-foreground">Replication</h2>
        <span className="font-mono text-[12.5px] tabular text-subtle">
          <span className="text-foreground">{replication.fullyReplicatedCount.toLocaleString()}</span> of{' '}
          {replication.totalTuples.toLocaleString()} ref updates on every node ·{' '}
          <span className="text-foreground">{replication.coveragePercent}%</span>
        </span>
      </div>

      {/* Coverage, as one bar. Ink on the fill track, never the needle. */}
      <div
        role="img"
        aria-label={`${replication.coveragePercent}% of ref updates are on every node`}
        className="mb-5 h-1.5 w-full bg-surface-secondary"
      >
        <span className="block h-full bg-foreground" style={{ width: `${replication.coveragePercent}%` }} />
      </div>

      {/* `relative` so the screen-reader-only labels in the cells, which are
          absolutely positioned, are contained by this scroller. Without it
          they sit against the page and widen it on a phone. */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[640px]" role="table" aria-label="Latest ref updates across nodes">
          <div role="row" className="grid items-center gap-x-4 px-2 pb-2" style={cols}>
            <span role="columnheader" className="text-[12.5px] text-subtle">When</span>
            <span role="columnheader" className="text-[12.5px] text-subtle">Repository and ref</span>
            <span role="columnheader" className="text-[12.5px] text-subtle">Commit</span>
            {labels.map(l => (
              <span key={l} role="columnheader" title={l} className="text-center font-mono text-[12px] text-subtle">
                {short(l)}
              </span>
            ))}
          </div>

          {rows.length === 0 ? (
            <div role="rowgroup">
              <div role="row" className="border-y border-border py-12">
                <span role="cell" className="text-[14px] text-muted">
                  No ref updates observed on any node yet.
                </span>
              </div>
            </div>
          ) : (
            <div role="rowgroup" className="border-y border-border">
              {rows.map(row => {
                const repoRef = parseEventRepo(row.tuple.repo);
                return (
                  <div
                    key={row.tuple.key}
                    role="row"
                    className="grid items-center gap-x-4 border-t border-separator px-2 py-[9px] transition-colors first:border-t-0 hover:bg-surface-secondary"
                    style={cols}
                  >
                    <span role="cell" title={row.tuple.timestamp} className="font-mono text-[12px] tabular text-subtle whitespace-nowrap">
                      {timeAgo(row.tuple.timestamp)}
                    </span>
                    <span role="cell" className="min-w-0 truncate font-mono text-[13px]">
                      {repoRef ? (
                        <>
                          <span className="text-subtle">{shortDid(repoRef.ownerDid)}/</span>
                          <span className="text-foreground">{repoRef.name}</span>
                        </>
                      ) : (
                        <span className="text-muted">{row.tuple.repo}</span>
                      )}
                      <span className="text-subtle"> · {shortRefName(row.tuple.ref_name)}</span>
                    </span>
                    <span role="cell" className="font-mono text-[12.5px] tabular text-muted">
                      <CopyValue value={row.tuple.new_sha} name="commit">
                        {shortSha(row.tuple.new_sha)}
                      </CopyValue>
                    </span>
                    {labels.map(label => {
                      const presence = row.presence[label] ?? 'missing';
                      return (
                        <span
                          key={label}
                          role="cell"
                          className="flex justify-center"
                          title={`${label}: ${PRESENCE[presence].title}`}
                        >
                          <Mark presence={presence} />
                          <span className="sr-only">{PRESENCE[presence].title}</span>
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 px-2 text-[12.5px] text-subtle">
        <span className="inline-flex items-center gap-2"><Mark presence="origin" /> Origin</span>
        <span className="inline-flex items-center gap-2"><Mark presence="replicated" /> Replicated</span>
        <span className="inline-flex items-center gap-2"><Mark presence="missing" /> Missing</span>
      </div>
    </section>
  );
}
