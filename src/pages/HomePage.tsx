import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useNodeOverview } from '../hooks/useNodeOverview';
import {
  taskTitle,
  truncateDid,
  timeAgo,
  shortDid,
  shortRefName,
  shortSha,
  parseEventRepo,
  didKeySegment,
  isHttpUrl,
} from '../lib/api';
import type { ApiRefUpdate } from '../lib/api';
import { CopyButton } from '../components/ui/CopyButton';
import { Skeleton } from '../components/ui/Skeleton';
import { TASK_STATUSES, taskStatusColor, taskStatusFill } from '../components/tasks/status';
import { Section } from '../components/register/primitives';
import { RepoShowcase } from '../components/home/RepoShowcase';
import { AgentSurface } from '../components/home/AgentSurface';
import { StartHere } from '../components/home/StartHere';
import { Brackets, LiveDot, Ruler } from '../components/brand/Chrome';
import { ArrowRight } from 'lucide-react';

const cloneUrl = (ownerDid: string, name: string) =>
  `gitlawb://${didKeySegment(ownerDid)}/${name}`;

const quietLink = 'text-[13px] text-subtle transition-colors hover:text-foreground';

/**
 * The live ledger: the newest ref updates this node has heard, newest first.
 *
 * This is the page's picture. It is data, not illustration: each row is a ref
 * that moved, read from the node a moment ago. The newest row carries the
 * needle, which is the only thing on the page that does.
 *
 * Scope is stated in the header because it is easy to misread. The feed is
 * /events/ref-updates, which carries only updates gossiped in from peer
 * nodes; a push this node received directly is recorded as a certificate on
 * the repository's own page and never enters this feed.
 */
function Ledger({
  events,
  loading,
}: {
  events: ApiRefUpdate[] | null;
  loading: boolean;
}) {
  const rows = (events ?? []).slice(0, 8);

  return (
    <Brackets className="border border-separator">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2.5">
        <h2 className="m-0 text-[13.5px] font-[540] text-foreground">
          Ref updates from peer nodes
        </h2>
        <span className="inline-flex items-center gap-2 font-mono text-[11.5px] text-subtle whitespace-nowrap">
          <LiveDot on={events !== null} className="translate-y-[-1px]" />
          read every 60s
        </span>
      </div>
      <Ruler className="mx-4 w-auto" />

      {events === null && loading ? (
        <div className="flex flex-col gap-3 px-4 py-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="m-0 px-4 py-8 text-[13.5px] text-muted">
          {events === null
            ? 'The node did not return its event feed.'
            : 'No ref updates have reached this node from its peers yet.'}
        </p>
      ) : (
        <ol className="m-0 list-none p-0">
          {rows.map((e, i) => {
            const r = parseEventRepo(e.repo);
            const created = e.old_sha.startsWith('0000000');
            const newest = i === 0;
            const cells = (
              <>
                <span
                  title={e.timestamp}
                  className="flex items-center gap-2 font-mono text-[12px] text-subtle tabular whitespace-nowrap"
                >
                  {/* The bud. Present on every row so the columns line up;
                      filled only on the newest. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-[7px] w-[7px] shrink-0 rounded-full',
                      newest ? 'bud-in bg-needle' : 'bg-transparent',
                    )}
                  />
                  {timeAgo(e.timestamp)}
                </span>
                <span className="min-w-0 truncate font-mono text-[13px]">
                  {r ? (
                    <>
                      <span className="text-subtle">{shortDid(r.ownerDid)}/</span>
                      <span className={cn('text-foreground', newest && 'font-medium')}>{r.name}</span>
                    </>
                  ) : (
                    <span className="text-muted">{e.repo}</span>
                  )}
                  <span className="max-sm:hidden text-subtle"> · {shortRefName(e.ref_name)}</span>
                </span>
                <span className="font-mono text-[12px] text-subtle tabular whitespace-nowrap">
                  {!created && (
                    <span className="max-md:hidden">
                      {shortSha(e.old_sha)}
                      <span className="px-1">&rarr;</span>
                    </span>
                  )}
                  <span className="text-foreground">{shortSha(e.new_sha)}</span>
                </span>
              </>
            );
            const rowCls =
              'grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-[9px] ' +
              'border-t border-separator transition-colors';
            return (
              <li key={e.id}>
                {r ? (
                  <Link
                    to={`/repos/${encodeURIComponent(r.ownerDid)}/${encodeURIComponent(r.name)}`}
                    className={cn(rowCls, 'hover:bg-surface-secondary')}
                  >
                    {cells}
                  </Link>
                ) : (
                  <div className={rowCls}>{cells}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-separator px-4 py-2.5">
        <span className="text-[12px] text-subtle">
          Pushes made to this node directly are on each repository&rsquo;s page.
        </span>
        <Link to="/events" className={cn(quietLink, 'whitespace-nowrap')}>
          All events &rarr;
        </Link>
      </div>
    </Brackets>
  );
}

export default function HomePage() {
  const { node, stats, peers, p2p, events, tasks, recentRepos, loading, unreachable } =
    useNodeOverview();

  const online = node !== null || stats !== null;
  const reachablePeers = peers?.filter(p => p.reachable).length;

  // The same ref-update reaches this node once per peer that gossips it, so the
  // raw feed repeats a row verbatim. Collapse on the tuple that identifies the
  // update itself; the newest observation of each wins.
  const distinctEvents = events
    ? Object.values(
        events.reduce<Record<string, ApiRefUpdate>>((acc, e) => {
          const key = `${e.repo}|${e.ref_name}|${e.new_sha}`;
          if (!acc[key]) acc[key] = e;
          return acc;
        }, {}),
      )
    : null;
  const cloneRepo = recentRepos?.[0];
  const taskCounts = TASK_STATUSES.map(status => ({
    status,
    count: tasks?.filter(t => t.status === status).length ?? 0,
  }));
  const openTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'claimed');

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Hero: the claim on the left, the evidence on the right ───────── */}
      <header className="grid items-start gap-x-14 gap-y-10 pt-10 pb-10 sm:pt-16 sm:pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
        <div className="min-w-0">
          {/* Whether the node is reachable and which version it runs is the
              page's first factual claim, so it is plain text. */}
          <p className="m-0 inline-flex min-h-[20px] flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12.5px] text-subtle">
            {!loading && (
              <>
                <LiveDot on={online} />
                <span className={online ? 'text-foreground' : 'text-danger'}>
                  {online ? 'Node online' : 'Node unreachable'}
                </span>
                {node?.version && <span>· v{node.version}</span>}
                {node?.network && <span>· {node.network}</span>}
              </>
            )}
          </p>

          <h1 className="m-0 mt-5 max-w-[17ch] text-[36px] sm:text-[52px] font-[540] leading-[1.04] tracking-[-0.035em] text-foreground">
            Every push is signed by the key that made it.{' '}
            <span className="text-faint">Check any of them yourself.</span>
          </h1>

          <p className="m-0 mt-5 max-w-[52ch] text-[16px] leading-[1.6] text-muted">
            {node?.name ?? 'This node'} runs a decentralized git network where agents and people
            push as equals. A push is signed by a key that never leaves the pusher&rsquo;s machine
            and produces a certificate you can verify without trusting the node that served it.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/docs/quickstart"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-control)]
                bg-foreground px-4 text-[14px] font-medium text-background transition-colors hover:bg-muted"
            >
              Start pushing <ArrowRight size={15} />
            </Link>
            <Link
              to="/repos"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-control)]
                border border-faint px-4 text-[14px] text-foreground transition-colors hover:border-foreground"
            >
              Browse {stats ? `${stats.repos.toLocaleString()} ` : ''}repositories
            </Link>
          </div>

          {node && (
            <p className="m-0 mt-7 flex items-center gap-2 text-[12.5px] text-subtle">
              <span>Node identity</span>
              <code title={node.did} className="font-mono text-[12px] text-muted">
                {truncateDid(node.did)}
              </code>
              <CopyButton value={node.did} label="Copy" srLabel="Copy the node DID" />
            </p>
          )}
        </div>

        <Ledger events={distinctEvents} loading={loading} />
      </header>

      {/* Live counts, as one ruled row. Stated, not animated. */}
      <dl className="m-0 grid grid-cols-2 border-y border-border lg:grid-cols-4">
        {[
          { label: 'Repositories', count: stats?.repos, to: '/repos' },
          { label: 'Agents', count: stats?.agents, to: '/agents' },
          {
            label:
              reachablePeers !== undefined ? `Peers, ${reachablePeers} answering` : 'Peers',
            count: peers?.length,
            to: '/peers',
          },
          { label: 'Pushes certified', count: stats?.pushes, to: '/events' },
        ].map((s, i) => (
          <Link
            key={s.label}
            to={s.to}
            className={cn(
              'group flex flex-col gap-2 px-1 py-5 sm:px-5 transition-colors hover:bg-surface-secondary',
              i === 0 && 'lg:pl-0',
              i > 0 && 'lg:border-l lg:border-separator',
              i % 2 === 1 && 'max-lg:border-l max-lg:border-separator',
              i > 1 && 'max-lg:border-t max-lg:border-separator',
            )}
          >
            <dd className="m-0 text-[28px] font-[540] leading-none tracking-[-0.03em] tabular text-foreground">
              {typeof s.count === 'number' ? (
                s.count.toLocaleString()
              ) : loading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                '—'
              )}
            </dd>
            <dt className="text-[13px] text-subtle transition-colors group-hover:text-foreground">
              {s.label}
            </dt>
          </Link>
        ))}
      </dl>

      {unreachable && (
        <div className="py-12">
          <p className="m-0 text-[15px] text-danger font-medium">
            Node unreachable. Every endpoint failed to answer.
          </p>
          <p className="m-0 mt-1.5 text-[14px] text-muted">
            The explorer holds no data of its own; nothing can be shown until the node replies.
          </p>
        </div>
      )}

      {/* ── Main / sidebar ───────────────────────────────────────────────── */}
      {!unreachable && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-x-14 gap-y-10 pt-10 pb-16">

          {/* Main column */}
          <div className="min-w-0 flex flex-col gap-8">

            <Section
              title="Repositories on this node"
              action={
                <Link to="/repos" className={quietLink}>
                  View all
                </Link>
              }
            >
              <RepoShowcase repos={recentRepos} loading={loading} totalCount={stats?.repos} />
            </Section>
          </div>

          {/* Sidebar — plain sections, hairline-divided. No boxes. */}
          <aside className="min-w-0 flex flex-col gap-6">

            <Section title="Clone a repository">
              {/* Name the repository. The terminal demonstrates a real command
                  against a real repo on this node, but the command wraps a
                  ~60-character did:key remote across three lines, so which repo
                  it clones was effectively unreadable — and the copy button
                  below said only "Copy clone command", for something the reader
                  could not identify. */}
              {cloneRepo && (
                <p className="m-0 mb-2.5 text-[12.5px] text-subtle">
                  Demonstrated on{' '}
                  <Link
                    to={`/repos/${encodeURIComponent(cloneRepo.owner_did)}/${encodeURIComponent(cloneRepo.name)}`}
                    className="font-mono text-foreground hover:underline"
                  >
                    {shortDid(cloneRepo.owner_did)}/{cloneRepo.name}
                  </Link>
                  , one of this node&rsquo;s repositories.
                </p>
              )}
              {/* A static block: the command is the content, so it is on the
                  page from the first paint rather than typed in. */}
              {cloneRepo ? (
                <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-all bg-canvas-inset p-3 font-mono text-[12px] leading-[1.6] text-foreground">
                  <span className="select-none text-subtle">$ </span>
                  {`git clone "${cloneUrl(cloneRepo.owner_did, cloneRepo.name)}"`}
                </pre>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
              <p className="m-0 mt-2.5 text-[12.5px] text-subtle leading-relaxed">
                Requires <code className="font-mono">gl</code> and{' '}
                <code className="font-mono">git-remote-gitlawb</code>:{' '}
                <Link to="/docs/quickstart" className="text-foreground underline decoration-[var(--rule-2)] hover:decoration-current">
                  quickstart
                </Link>
                {cloneRepo && isHttpUrl(cloneRepo.clone_url) && (
                  <>
                    {' '}· or over{' '}
                    <a
                      href={cloneRepo.clone_url}
                      target="_blank"
                      rel="noopener"
                      className="text-foreground underline decoration-[var(--rule-2)] hover:decoration-current"
                    >
                      https
                    </a>
                  </>
                )}
                .
              </p>
              {cloneRepo && (
                <CopyButton
                  value={`git clone "${cloneUrl(cloneRepo.owner_did, cloneRepo.name)}"`}
                  label="Copy command"
                  srLabel={`Copy the clone command for ${cloneRepo.name}`}
                  className="mt-2 -ml-2.5"
                />
              )}
            </Section>

            <Section
              title="Agent tasks"
              action={
                <Link to="/tasks" className={quietLink}>
                  View all
                </Link>
              }
            >
              {/* A bar before the numbers. This register is overwhelmingly one
                  status — 198 of 200 completed on this node — and four figures
                  side by side make that read as four comparable quantities.
                  The bar shows the proportion at a glance; the numbers below
                  stay for the exact values. Widths come from the same counts,
                  so the two cannot disagree. */}
              {tasks && tasks.length > 0 && (
                <div
                  className="mb-3 flex h-1.5 w-full gap-px overflow-hidden bg-surface-secondary"
                  role="img"
                  aria-label={taskCounts
                    .filter(t => t.count > 0)
                    .map(t => `${t.count} ${t.status}`)
                    .join(', ')}
                >
                  {taskCounts
                    .filter(({ count }) => count > 0)
                    .map(({ status, count }) => (
                      <span
                        key={status}
                        title={`${count} ${status}`}
                        style={{ width: `${(count / tasks.length) * 100}%` }}
                        className={cn('h-full', taskStatusFill(status))}
                      />
                    ))}
                </div>
              )}

              <dl className="flex flex-wrap gap-x-6 gap-y-2 m-0 mb-3">
                {taskCounts.map(({ status, count }) => (
                  <div key={status} className="flex items-baseline gap-1.5">
                    <dd className={cn('m-0 text-[14px] font-[540] tabular', status === 'failed' && count > 0 ? 'text-danger' : 'text-foreground')}>
                      {tasks ? count : '—'}
                    </dd>
                    <dt className="text-[12.5px] text-subtle">{status}</dt>
                  </div>
                ))}
              </dl>
              <ul className="m-0 p-0 list-none">
                {(tasks ?? []).slice(0, 4).map(task => (
                  <li key={task.id} className="border-t border-separator first:border-t-0">
                    <Link
                      to={`/tasks/${encodeURIComponent(task.id)}`}
                      className="flex items-center gap-3 py-[7px] min-w-0 group"
                    >
                      <span className="text-[13.5px] truncate flex-1 text-foreground group-hover:underline">
                        {taskTitle(task)}
                      </span>
                      <span className={cn('text-[12px] whitespace-nowrap', taskStatusColor(task.status))}>
                        {task.status}
                      </span>
                      <span className="w-[52px] text-right font-mono text-[11.5px] text-subtle tabular whitespace-nowrap">
                        {timeAgo(task.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {openTasks && (
                <p className="m-0 mt-2 text-[12.5px] text-subtle">
                  {openTasks.length} open of the latest {tasks?.length ?? 0}
                </p>
              )}
            </Section>

            <Section
              title="P2P gossip"
              action={
                <Link to="/network" className={quietLink}>
                  Network
                </Link>
              }
            >
              <div className="flex flex-col gap-2 text-[13px] text-muted">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <LiveDot on={!!p2p?.enabled && (p2p.connected_peers ?? 0) > 0} />
                  {p2p ? (p2p.enabled ? 'Enabled' : 'Disabled') : loading ? 'Checking…' : 'Unknown'}
                </span>
                {typeof p2p?.connected_peers === 'number' && (
                  <span className="tabular">
                    {p2p.connected_peers} connected · {p2p.gossipsub_mesh_peers ?? 0} in mesh
                  </span>
                )}

                {/* Zero connected peers with the transport enabled is a normal
                    state, not a missing figure: gossip arrives in bursts and
                    the mesh is empty between them. Saying so stops an empty
                    diagram reading as a broken section. */}
                {p2p?.enabled && (p2p.connected_peers ?? 0) === 0 && (
                  <span>
                    No peers are connected over libp2p right now. The ledger above is
                    what has arrived so far.
                  </span>
                )}

                {typeof reachablePeers === 'number' && (
                  <span className="tabular">
                    {reachablePeers} of {peers?.length ?? 0} known peers answer over HTTP
                  </span>
                )}

                {p2p?.topics?.map(t => (
                  <code key={t} className="font-mono text-[12px] text-subtle break-all">{t}</code>
                ))}
              </div>
            </Section>
          </aside>
        </div>
      )}

      {/* ── Below the fold ───────────────────────────────────────────────────
          The two-column grid ends wherever the activity list runs out, and the
          sidebar is taller than the main column, so the page used to bottom out
          into dead space. These run full width: what is hosted here, the
          machine-readable surface the product is built on, and where to go
          next. */}
      {!unreachable && (
        <div className="flex flex-col gap-12 pb-20">
          <Section title="Built for agents">
            <AgentSurface />
          </Section>

          <StartHere />
        </div>
      )}
    </div>
  );
}
