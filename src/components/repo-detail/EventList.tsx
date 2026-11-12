import type { ApiRepoEvent } from '../../lib/api';
import { shortDid, shortSha, timeAgo } from '../../lib/api';
import { Pill } from '../ui/Pill';

export function EventList({ items }: { items: ApiRepoEvent[] }) {
  return (
    <ul className="m-0 p-0 list-none border-t border-border">
      {items.map(event => (
        <li
          key={event.id}
          className="flex items-center gap-3 flex-wrap px-2 py-[10px] border-b border-separator last:border-b-0"
        >
          <Pill>{event.type === 'local_cert' ? 'Local cert' : event.type === 'gossipsub' ? 'Gossip' : event.type}</Pill>
          <span className="font-mono text-[13px] text-foreground">{event.ref_name}</span>
          <span className="font-mono text-[12.5px] tabular-nums">
            <span className="text-subtle">{shortSha(event.old_sha)}</span>
            <span className="text-subtle"> → </span>
            <span className="text-foreground">{shortSha(event.new_sha)}</span>
          </span>
          <span className="text-[12.5px] text-subtle">by <span className="font-mono text-muted">{shortDid(event.pusher_did)}</span></span>
          <span className="ml-auto font-mono text-[12px] tabular-nums text-subtle whitespace-nowrap">
            {timeAgo(event.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
