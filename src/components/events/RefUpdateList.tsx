import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { ApiRefUpdate } from '../../lib/api';
import { parseEventRepo, shortRefName, shortSha, shortDid, timeAgo, isGossip } from '../../lib/api';
import { Skeleton } from '../ui/Skeleton';
import { CopyValue } from '../ui/CopyValue';

/**
 * Ref updates, as a ledger: one ruled row per update, in fixed columns, so a
 * reader can run an eye down any one of them. It is a grid of divs, so it
 * carries table roles for screen readers. The newest row on the first
 * page carries the needle.
 *
 * Columns collapse from the right as the page narrows; the repository, the
 * new commit and the time survive at every width.
 */
const GRID =
  'grid items-center gap-x-4 px-2 ' +
  'grid-cols-[76px_minmax(0,1fr)_auto] ' +
  'md:grid-cols-[76px_minmax(0,1.3fr)_minmax(0,1fr)_150px] ' +
  'lg:grid-cols-[76px_minmax(0,1.3fr)_minmax(0,1fr)_150px_92px_92px]';

function Row({ event, newest }: { event: ApiRefUpdate; newest: boolean }) {
  const repoRef = parseEventRepo(event.repo);
  const gossip = isGossip(event);
  const created = event.old_sha?.startsWith('0000000');

  return (
    <div role="row" className={cn(GRID, 'border-t border-separator py-[9px] transition-colors first:border-t-0 hover:bg-surface-secondary')}>
      <span
        role="cell"
        title={event.timestamp}
        className="flex items-center gap-2 font-mono text-[12px] text-subtle tabular whitespace-nowrap"
      >
        <span
          aria-hidden="true"
          className={cn('h-[7px] w-[7px] shrink-0 rounded-full', newest ? 'bud-in bg-needle' : 'bg-transparent')}
        />
        {timeAgo(event.timestamp)}
      </span>

      <span role="cell" className="min-w-0 truncate font-mono text-[13px]">
        {repoRef ? (
          <Link
            data-row-link
            to={`/repos/${encodeURIComponent(repoRef.ownerDid)}/${encodeURIComponent(repoRef.name)}`}
            className="hover:underline"
          >
            <span className="text-subtle">{shortDid(repoRef.ownerDid)}/</span>
            <span className={cn('text-foreground', newest && 'font-medium')}>{repoRef.name}</span>
          </Link>
        ) : (
          <span className="text-muted">{event.repo}</span>
        )}
      </span>

      <span role="cell" className="max-md:hidden min-w-0 truncate font-mono text-[12.5px] text-muted" title={event.ref_name}>
        {shortRefName(event.ref_name)}
      </span>

      <span role="cell" className="font-mono text-[12.5px] text-subtle tabular whitespace-nowrap max-md:text-right">
        {created ? (
          <span className="max-md:hidden">new</span>
        ) : (
          <span className="max-md:hidden">{shortSha(event.old_sha)}</span>
        )}
        <span className="max-md:hidden px-1.5">&rarr;</span>
        <CopyValue value={event.new_sha} name="commit" className="text-foreground">
          {shortSha(event.new_sha)}
        </CopyValue>
      </span>

      <span role="cell" className="max-lg:hidden truncate font-mono text-[12.5px] text-muted">
        <CopyValue value={event.pusher_did} name="pusher DID">
          {shortDid(event.pusher_did)}
        </CopyValue>
      </span>

      <span
        role="cell"
        className="max-lg:hidden truncate font-mono text-[12.5px] text-subtle"
        title={gossip ? `Gossiped from ${event.from_peer}` : 'Received directly by this node'}
      >
        {gossip ? shortDid(event.from_peer ?? '') : 'this node'}
      </span>
    </div>
  );
}

function Header() {
  const th = 'text-[12.5px] text-subtle';
  return (
    <div role="row" className={cn(GRID, 'pb-2')}>
      <span role="columnheader" className={cn(th, 'pl-[15px]')}>When</span>
      <span role="columnheader" className={th}>Repository</span>
      <span role="columnheader" className={cn(th, 'max-md:hidden')}>Ref</span>
      <span role="columnheader" className={cn(th, 'max-md:text-right')}>Commit</span>
      <span role="columnheader" className={cn(th, 'max-lg:hidden')}>Pusher</span>
      <span role="columnheader" className={cn(th, 'max-lg:hidden')}>Via peer</span>
    </div>
  );
}

interface RefUpdateListProps {
  events: ApiRefUpdate[] | null;
  loading?: boolean;
  skeletonCount?: number;
  header?: boolean;
  emptyMessage?: string;
  /** True when the first row is the newest update in the whole feed. */
  markNewest?: boolean;
}

export function RefUpdateList({
  events,
  loading = false,
  skeletonCount = 8,
  // The global feed carries peer gossip only; local pushes surface on the repo
  // page, not here — don't promise otherwise.
  emptyMessage = 'No gossip from peer nodes yet',
  markNewest = false,
}: RefUpdateListProps) {
  return (
    <div
      role="table"
      aria-label="Ref updates"
      className={cn(
        'transition-opacity duration-200',
        loading && events !== null && 'opacity-40 pointer-events-none',
      )}
    >
      <Header />
      {events === null ? (
        <div role="rowgroup" className="flex flex-col border-t border-border" aria-busy="true" aria-label="Loading events">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <div key={i} role="row" className="border-t border-separator px-2 py-[11px] first:border-t-0">
              <span role="cell" className="block">
                <Skeleton className="h-4 w-full" />
              </span>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div role="rowgroup">
          <div role="row" className="border-t border-border py-14">
            <span role="cell" className="text-[14px] text-muted">{emptyMessage}</span>
          </div>
        </div>
      ) : (
        <div role="rowgroup" className="border-y border-border">
          {events.map((event, i) => (
            <Row key={event.id} event={event} newest={markNewest && i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
