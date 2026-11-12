import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { fetchTask, taskTitle, prettyJson, truncateDid, formatDate, timeAgo, didKeySegment } from '../lib/api';
import type { ApiTask } from '../lib/api';
import { taskStatusColor } from '../components/tasks/status';
import { MicroLabel } from '../components/ui/MicroLabel';
import { Pill } from '../components/ui/Pill';
import { CopyButton } from '../components/ui/CopyButton';
import { Skeleton } from '../components/ui/Skeleton';
function PageBreadcrumb({ id }: { id: string }) {
  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="m-0 flex list-none items-center gap-1.5 p-0 font-mono text-[12.5px] flex-nowrap min-w-0 text-subtle">
        <li className="shrink-0 inline-flex items-center gap-1.5">
          <Link
            to="/tasks"
            className="hover:text-foreground transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            tasks
          </Link>
        </li>
        <li role="presentation" aria-hidden="true" className="shrink-0">/</li>
        <li className="min-w-0 inline-flex items-center gap-1.5">
          <span className="text-foreground truncate block">{id.slice(0, 8)}</span>
        </li>
      </ol>
    </nav>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <MicroLabel>{label}</MicroLabel>
      <div className="font-mono text-[13px] text-foreground min-w-0">{children}</div>
    </div>
  );
}

function DidField({ label, did }: { label: string; did: string }) {
  return (
    <Field label={label}>
      <span className="flex items-center gap-2 min-w-0">
        <Link
          to={`/agents?q=${encodeURIComponent(didKeySegment(did))}`}
          className="truncate hover:underline"
          title={did}
        >
          {truncateDid(did)}
        </Link>
        <CopyButton value={did} label="Copy" srLabel="Copy the DID" />
      </span>
    </Field>
  );
}

function JsonPanel({ label, raw }: { label: string; raw: string }) {
  return (
    <section className="border-t border-border pt-4 min-w-0">
      <div className="flex items-center justify-between gap-3 h-10">
        <MicroLabel>{label}</MicroLabel>
        <CopyButton value={raw} label={label} />
      </div>
      <pre className="m-0 bg-canvas-inset p-4 font-mono text-[12.5px] leading-[1.65] text-foreground overflow-x-auto whitespace-pre-wrap break-words">
        {prettyJson(raw)}
      </pre>
    </section>
  );
}

export default function TaskDetailPage() {
  const { id = '' } = useParams();
  const [task, setTask] = useState<ApiTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Render-phase reset on navigation between tasks (react-hooks/set-state-in-effect)
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setTask(null);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchTask(id, controller.signal)
      .then(t => {
        if (!controller.signal.aborted) setTask(t);
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error && err.message === 'not_found' ? 'not_found' : 'failed');
        }
      });
    return () => controller.abort();
  }, [id]);

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <PageBreadcrumb id={id} />
        <div className="border-t border-border py-16">
          <h1 className="m-0 mb-2 text-[28px] font-[540] tracking-[-0.03em]">
            {error === 'not_found' ? 'Task not found' : 'Failed to load task'}
          </h1>
          <p className="m-0 mb-6 text-[15px] text-muted">
            {error === 'not_found'
              ? `No task with id ${id} exists on this node.`
              : 'The node did not answer. Try again.'}
          </p>
          <Pill to="/tasks" className="rounded-[var(--radius-control)] px-2.5 py-1 text-[13px]">← Back to tasks</Pill>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageBreadcrumb id={id} />

      {/* Header */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <MicroLabel>agent task</MicroLabel>
          {task && (
            <span className={cn('inline-block text-[12.5px] first-letter:uppercase', taskStatusColor(task.status))}>
              {task.status}
            </span>
          )}
        </div>
        <div>
          {task === null ? (
            <>
              <Skeleton className="h-8 w-2/3 max-w-[480px] mb-4" />
              <Skeleton className="h-4 w-40" />
            </>
          ) : (
            <>
              <h1 className="m-0 text-[26px] sm:text-[34px] font-[540] leading-[1.1] tracking-[-0.03em] text-foreground mb-3 break-words">
                {taskTitle(task)}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-[12px] text-muted">
                <Pill className="font-mono">{task.kind}</Pill>
                {task.capability && <Pill className="font-mono">{task.capability}</Pill>}
                <span className="font-mono text-subtle">{task.id}</span>
                <CopyButton value={task.id} label="Copy" srLabel="Copy the task id" />
              </div>
            </>
          )}
        </div>
      </section>

      {task && (
        <>
          {/* Facts grid */}
          <section className="border-t border-border pt-4 mb-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 py-4">
              <DidField label="delegator" did={task.delegator_did} />
              {task.assignee_did ? (
                <DidField label="assignee" did={task.assignee_did} />
              ) : (
                <Field label="assignee"><span className="font-sans text-subtle">Unclaimed</span></Field>
              )}
              <Field label="created">
                <span title={task.created_at}>{formatDate(task.created_at)} · {timeAgo(task.created_at)}</span>
              </Field>
              <Field label="updated">
                <span title={task.updated_at}>{formatDate(task.updated_at)} · {timeAgo(task.updated_at)}</span>
              </Field>
              <Field label="deadline">
                {task.deadline ? <span title={task.deadline}>{formatDate(task.deadline)}</span> : <span className="font-sans text-subtle">None</span>}
              </Field>
              <Field label="repo">
                {task.repo_id ? <span className="break-all">{task.repo_id}</span> : <span className="text-muted">—</span>}
              </Field>
            </div>
          </section>

          {/* Payload / result */}
          <div className="flex flex-col gap-6 pb-20">
            {task.payload && <JsonPanel label="payload" raw={task.payload} />}
            {task.result && <JsonPanel label="result" raw={task.result} />}
            {!task.payload && !task.result && (
              <p className="m-0 text-[14px] text-muted">This task carries no payload or result data.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
