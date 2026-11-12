import type { TaskStatus } from '../../lib/api';

export const TASK_STATUSES: TaskStatus[] = ['pending', 'claimed', 'completed', 'failed'];

/**
 * Text colour per task status.
 *
 * Status is read from the word. Ink weight orders the states (done is full
 * ink, in-flight is dimmer), and only a failure takes a colour, because a
 * failure has to be findable in a long column.
 */
export function taskStatusColor(status: string): string {
  switch (status) {
    case 'claimed':
      return 'text-muted';
    case 'completed':
      return 'text-foreground';
    case 'failed':
      return 'text-danger';
    default: // pending & unknown
      return 'text-subtle';
  }
}

/**
 * Fill colour per task status, for bars and swatches.
 *
 * Written out rather than derived from `taskStatusColor` by swapping the
 * prefix: Tailwind generates CSS only for class names it can read in the
 * source, so a name assembled at runtime produces no rule at all and the
 * element paints nothing.
 */
export function taskStatusFill(status: string): string {
  switch (status) {
    case 'claimed':
      return 'bg-subtle';
    case 'completed':
      return 'bg-foreground';
    case 'failed':
      return 'bg-danger';
    default: // pending & unknown
      return 'bg-faint';
  }
}
