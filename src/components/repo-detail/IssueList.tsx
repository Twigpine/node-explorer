import type { ApiIssue } from '../../lib/api';
import { shortDid, timeAgo } from '../../lib/api';
import { Pill } from '../ui/Pill';

export function IssueList({ items }: { items: ApiIssue[] }) {
  return (
    <ul className="m-0 p-0 list-none border-t border-border">
      {items.map(issue => (
        <li key={issue.id} className="px-2 py-3.5 border-b border-separator last:border-b-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Pill active={issue.status === 'open'}>{issue.status}</Pill>
            <span className="text-[14px] font-medium text-foreground break-words min-w-0">{issue.title}</span>
          </div>
          <p className="m-0 mt-1.5 text-[12.5px] text-subtle">
            by <span className="font-mono text-muted">{shortDid(issue.author)}</span> · {timeAgo(issue.created_at)}
          </p>
          {issue.body && (
            <p className="m-0 mt-2 text-[12.5px] leading-relaxed text-muted line-clamp-2">
              {issue.body}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
