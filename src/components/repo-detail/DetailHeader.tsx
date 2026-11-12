import type { Repository } from '../../types/repo';
import { shortDid, truncateDid } from '../../lib/api';
import { CopyButton } from '../ui/CopyButton';
import { Seal } from '../register/primitives';
import { GitFork, Star } from 'lucide-react';

interface DetailHeaderProps {
  repo: Repository;
}

/**
 * The repository header.
 *
 * The name, then the facts, dense and scannable.
 *
 * Fields holding this node's default value (public, `main`) are not printed:
 * effectively every repository here is both, so showing them on every page
 * spends the slot beside the name on nothing and trains the reader to skip the
 * place an exception would appear.
 */
export function DetailHeader({ repo }: DetailHeaderProps) {
  const fullDid = repo.owner;
  const offBranch = repo.branch && repo.branch !== 'main' && repo.branch !== 'master';
  const restricted = repo.visibility !== 'public';

  return (
    <div className="pb-6">
      <div className="min-w-0">
        <h1 className="m-0 font-mono text-[24px] sm:text-[30px] font-medium leading-tight tracking-[-0.02em] break-words">
          <span className="font-normal text-subtle">{shortDid(repo.owner)}/</span>
          <span className="text-foreground">{repo.name}</span>
        </h1>

        {(offBranch || restricted || repo.isMirror) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {restricted && <Seal label={repo.visibility} tone="attention" />}
            {offBranch && (
              <span className="inline-flex items-center gap-1.5 border border-border px-1.5 py-px font-mono text-[12px] text-muted">
                default: {repo.branch}
              </span>
            )}
            {repo.isMirror && (
              <span className="inline-flex items-center gap-1.5 border border-border px-1.5 py-px text-[12px] text-muted">
                <GitFork size={11} />
                Mirrored from a peer
              </span>
            )}
          </div>
        )}

        {repo.description && (
          <p className="m-0 mt-3 text-[16px] leading-relaxed max-w-[72ch] text-muted">
            {repo.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-x-6 gap-y-2 flex-wrap text-[13px] text-subtle">
          {repo.stars > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Star size={13} />
              <span className="text-foreground font-medium tabular">{repo.stars}</span>
            </span>
          )}
          <span>
            Updated <span className="text-foreground">{repo.updatedAt}</span>
          </span>
          <span>
            Created <span className="text-foreground">{repo.createdAt}</span>
          </span>
          <span className="inline-flex items-center gap-2 min-w-0">
            Owner
            <code
              title={fullDid}
              className="font-mono text-[12px] text-muted truncate max-w-[22ch] sm:max-w-none"
            >
              {truncateDid(fullDid)}
            </code>
            <CopyButton value={fullDid} label="Copy" srLabel="Copy the owner DID" />
          </span>
        </div>
      </div>
    </div>
  );
}
