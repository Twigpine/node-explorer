import { Link } from 'react-router-dom';
import { Star, GitFork } from 'lucide-react';
import type { Repository } from '../../types/repo';
import { shortDid } from '../../lib/api';
import { usePrefetchRepo } from '../../hooks/usePrefetch';
import { useRepoActivity } from '../../hooks/useRepoActivity';
import { CopyButton } from '../ui/CopyButton';
import { Sparkline } from './Sparkline';

interface RepoRowProps {
  repo: Repository;
  index: number;
}

/**
 * One row in the repository list.
 *
 * Constant-valued fields are not printed. On this node effectively every
 * repository is public and on `main`, so labelling all five thousand rows with
 * both spends the most prominent slot beside the name on zero information —
 * and trains the reader to skip the place an exception would appear. A field
 * shows only where it departs from the default.
 */
export function RepoRow({ repo }: RepoRowProps) {
  const prefetch = usePrefetchRepo(repo.owner, repo.name);
  const { ref, activity } = useRepoActivity(repo.owner, repo.name);

  const offBranch = repo.branch && repo.branch !== 'main' && repo.branch !== 'master';
  const restricted = repo.visibility !== 'public';

  return (
    <li
      ref={ref}
      {...prefetch}
      className="group relative grid items-center gap-x-4 sm:gap-x-6
        grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]
        md:grid-cols-[minmax(0,1fr)_64px_auto]
        border-b border-separator last:border-b-0 px-2 py-3
        transition-colors hover:bg-surface-secondary"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
          <Link
            to={`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`}
            data-row-link
            className="font-mono text-[14px] leading-snug outline-none min-w-0 font-medium text-foreground
              after:absolute after:inset-0 after:content-['']
              hover:underline
              focus-visible:after:outline focus-visible:after:outline-2
              focus-visible:after:outline-accent focus-visible:after:-outline-offset-2"
          >
            <span className="text-subtle font-normal">{shortDid(repo.owner)}/</span>
            <span className="break-all sm:break-normal">{repo.name}</span>
          </Link>

          {restricted && (
            <span className="border border-attention/50 text-attention px-1.5 py-px text-[12px]">
              {repo.visibility}
            </span>
          )}
          {offBranch && (
            <span className="border border-border text-muted px-1.5 py-px font-mono text-[12px]">
              {repo.branch}
            </span>
          )}
          {repo.isMirror && (
            <span
              title="Mirrored from a peer node"
              className="inline-flex items-center text-muted"
            >
              <GitFork size={13} />
            </span>
          )}
        </div>

        {/* Two lines on a phone, one on desktop. Stacked, the row has the width
            for a second line, and a description cut mid-word tells the reader
            less than the sentence does. Desktop keeps one line so the list
            stays scannable at density. */}
        {repo.description && (
          <p className="m-0 mt-1 text-[13.5px] leading-snug text-muted line-clamp-2 sm:line-clamp-none sm:truncate">
            {repo.description}
          </p>
        )}
      </div>

      {/* Weekly commit activity — real data from the node. */}
      <div className="hidden md:flex justify-end relative z-10">
        <Sparkline data={activity} />
      </div>

      <div className="mt-1.5 sm:mt-0 flex items-center gap-3 whitespace-nowrap justify-self-start sm:justify-self-end">
        {repo.stars > 0 && (
          <span className="inline-flex items-center gap-1 font-mono text-[12px] tabular text-subtle">
            <Star size={12} />
            {repo.stars}
          </span>
        )}
        <span className="w-[60px] text-right font-mono text-[12px] tabular text-subtle">{repo.updatedAt}</span>
        <span className="relative z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <CopyButton value={`git clone ${repo.cloneUrl}`} label="Clone" srLabel={`Copy the clone command for ${repo.name}`} />
        </span>
      </div>
    </li>
  );
}
