import { Link } from 'react-router-dom';
import { Star, GitFork } from 'lucide-react';
import { shortDid, timeAgo } from '../../lib/api';
import type { ApiRepo } from '../../lib/api';
import { Skeleton } from '../ui/Skeleton';

/**
 * The repositories this node is serving.
 *
 * The overview previously ended on a list of ref-update lines — commit shas and
 * branch names, which say the network is moving but not what is on it. This
 * says what is actually hosted, which is the thing a visitor came to see.
 *
 * Every field is read from the repository record as the node returns it:
 * `star_count` and `forked_from` are real columns, so the star count and the
 * fork mark are facts rather than decoration, and both are omitted when they
 * carry nothing.
 */
interface RepoShowcaseProps {
  repos: ApiRepo[] | null;
  loading: boolean;
  /** Total repositories on the node, for the "browse all" line. */
  totalCount?: number;
}

export function RepoShowcase({ repos, loading, totalCount }: RepoShowcaseProps) {
  if (loading && !repos) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="border-t border-separator py-3 first:border-t-0">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return <p className="m-0 text-[13.5px] text-muted">No repositories on this node yet.</p>;
  }

  return (
    <>
      {/* Ruled rows, not cards: the same row the repositories index uses, so
          the overview is a first page of that list rather than a showcase. */}
      <ul className="m-0 list-none p-0">
        {repos.slice(0, 9).map(repo => (
          <li key={repo.id} className="border-t border-separator first:border-t-0">
            <Link
              to={`/repos/${encodeURIComponent(repo.owner_did)}/${encodeURIComponent(repo.name)}`}
              className="group -mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-0.5 px-2 py-3
                transition-colors hover:bg-surface-secondary"
            >
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 truncate font-mono text-[13.5px]">
                  <span className="text-subtle">{shortDid(repo.owner_did)}/</span>
                  <span className="font-medium text-foreground group-hover:underline">{repo.name}</span>
                </span>
                {repo.forked_from && (
                  <GitFork size={12} aria-label="fork" className="shrink-0 translate-y-px text-subtle" />
                )}
              </span>
              <span className="row-span-2 flex items-center gap-4 self-center font-mono text-[12px] text-subtle tabular whitespace-nowrap">
                {repo.star_count > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star size={11} aria-hidden="true" />
                    {repo.star_count}
                  </span>
                )}
                <span className="max-sm:hidden">{repo.default_branch}</span>
                <span className="w-[56px] text-right">{timeAgo(repo.updated_at)}</span>
              </span>
              <span className="min-w-0 truncate text-[13.5px] text-muted">
                {repo.description ?? <span className="text-subtle">No description</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to="/repos"
        className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] text-foreground underline decoration-[var(--rule-2)] underline-offset-4 hover:decoration-current"
      >
        Browse all{totalCount ? ` ${totalCount.toLocaleString()}` : ''} repositories
        <span aria-hidden="true">→</span>
      </Link>
    </>
  );
}
