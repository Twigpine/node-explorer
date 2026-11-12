import type { ApiPull } from '../../lib/api';
import { shortDid, timeAgo } from '../../lib/api';
import { Pill } from '../ui/Pill';

export function PullList({ items }: { items: ApiPull[] }) {
  return (
    <ul className="m-0 p-0 list-none border-t border-border">
      {items.map(pull => (
        <li key={pull.id} className="px-2 py-3.5 border-b border-separator last:border-b-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[12.5px] tabular-nums text-subtle">#{pull.number}</span>
            <Pill active={pull.status === 'open'}>{pull.status}</Pill>
            <span className="text-[14px] font-medium text-foreground break-words min-w-0">{pull.title}</span>
          </div>
          <p className="m-0 mt-1.5 text-[12.5px] text-subtle">
            <span className="font-mono text-foreground">{pull.source_branch}</span>
            {' → '}
            <span className="font-mono text-muted">{pull.target_branch}</span>
            {' · by '}
            <span className="font-mono text-muted">{shortDid(pull.author_did)}</span>
            {' · '}
            {pull.merged_at ? `merged ${timeAgo(pull.merged_at)}` : timeAgo(pull.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
