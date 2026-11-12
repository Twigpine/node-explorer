import type { RepoCommit } from '../../types/repo';
import { CopyValue } from '../ui/CopyValue';

interface CommitStripProps {
  commit: RepoCommit;
}

/** The latest commit, as one ruled line under the header. */
export function CommitStrip({ commit }: CommitStripProps) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 border-y border-border py-3 sm:gap-4">
      <span className="hidden shrink-0 text-[12.5px] text-subtle sm:block">Latest commit</span>
      <CopyValue value={commit.hash} name="commit" className="shrink-0 text-[12.5px] text-foreground">
        {commit.shortHash}
      </CopyValue>
      <span className="min-w-0 flex-1 truncate text-[13.5px] text-muted">{commit.message}</span>
      <span className="shrink-0 font-mono text-[12px] tabular-nums text-subtle">{commit.time}</span>
    </div>
  );
}
