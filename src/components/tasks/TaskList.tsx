import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { ApiTask } from '../../lib/api';
import { taskTitle, shortDid, timeAgo } from '../../lib/api';
import { taskStatusColor } from './status';
import { MicroLabel } from '../ui/MicroLabel';
import { Skeleton } from '../ui/Skeleton';

function TaskRow({ task, index }: { task: ApiTask; index: number }) {
  return (
    <li
      className="border-b border-separator last:border-b-0 hover:bg-surface-secondary transition-colors
        "
      style={{ animationDelay: `${index * 16}ms` }}
    >
      <Link
        to={`/tasks/${task.id}`}
        data-row-link
        className="grid grid-cols-[minmax(0,1fr)_80px] md:grid-cols-[84px_minmax(0,1fr)_130px_130px_80px]
          items-baseline gap-x-3 md:gap-x-4 px-2 py-[10px]"
      >
        <span className={cn('max-md:hidden text-[12.5px]', taskStatusColor(task.status))}>
          {task.status}
        </span>

        {/* Title + kind/capability */}
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-foreground">{taskTitle(task)}</span>
          <span className="block mt-0.5 font-mono text-[12px] text-subtle truncate">
            {task.kind}
            {task.capability && <> · {task.capability}</>}
            <span className="md:hidden"> · {task.status}</span>
          </span>
        </span>

        {/* Delegator */}
        <span className="hidden md:block font-mono text-[12.5px] text-muted truncate" title={task.delegator_did}>
          {shortDid(task.delegator_did)}
        </span>

        {/* Assignee */}
        <span
          className={cn('hidden md:block text-[12.5px] truncate', task.assignee_did ? 'font-mono text-muted' : 'text-subtle')}
          title={task.assignee_did ?? undefined}
        >
          {task.assignee_did ? shortDid(task.assignee_did) : 'Unclaimed'}
        </span>

        {/* Time */}
        <span className="font-mono text-[12px] text-subtle tabular-nums text-right whitespace-nowrap">
          {timeAgo(task.created_at)}
        </span>
      </Link>
    </li>
  );
}

function TaskRowSkeleton() {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_80px] md:grid-cols-[84px_minmax(0,1fr)_130px_130px_80px]
      items-center gap-x-3 md:gap-x-4 px-2 py-[10px] border-b border-separator last:border-b-0">
      <span className="max-md:hidden" />
      <div>
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-3 w-32 mt-1.5" />
      </div>
      <Skeleton className="hidden md:block h-4 w-24" />
      <Skeleton className="hidden md:block h-4 w-24" />
      <Skeleton className="h-3 w-14 justify-self-end" />
    </li>
  );
}

interface TaskListProps {
  tasks: ApiTask[] | null;
  loading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
}

export function TaskList({ tasks, loading = false, skeletonCount = 10, emptyMessage = 'No tasks match.' }: TaskListProps) {
  return (
    <div className={cn(
      'transition-opacity duration-200',
      loading && tasks !== null && 'opacity-40 pointer-events-none',
    )}>
      <div className="hidden md:grid grid-cols-[84px_minmax(0,1fr)_130px_130px_80px] gap-x-4 px-2 h-9 items-center border-b border-border">
        <MicroLabel>status</MicroLabel>
        <MicroLabel>task</MicroLabel>
        <MicroLabel>delegator</MicroLabel>
        <MicroLabel>assignee</MicroLabel>
        <MicroLabel className="text-right">created</MicroLabel>
      </div>

      {tasks === null ? (
        <ul className="m-0 p-0 list-none" aria-busy="true" aria-label="loading tasks">
          {Array.from({ length: skeletonCount }, (_, i) => <TaskRowSkeleton key={i} />)}
        </ul>
      ) : tasks.length === 0 ? (
        <p className="m-0 py-14 text-[14px] text-muted">{emptyMessage}</p>
      ) : (
        <ul className="m-0 p-0 list-none">
          {tasks.map((task, i) => <TaskRow key={task.id} task={task} index={i} />)}
        </ul>
      )}
    </div>
  );
}
