import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useRepository } from '../hooks/useRepository';
import { useRepositorySocialMetadata } from '../hooks/useRepositorySocialMetadata';
import { useShortcut, useShortcuts } from '../hooks/useShortcuts';
import { shortDid, didKeySegment } from '../lib/api';
import { normalizeRepoPath } from '../lib/lang';
import { buildRepoCodeSearch } from '../lib/repoNavigation';
import { cn } from '../lib/utils';
import { FileFinder } from '../components/repo-detail/FileFinder';
import { DetailHeader } from '../components/repo-detail/DetailHeader';
import { ClonePanel } from '../components/repo-detail/ClonePanel';
import { CommitStrip } from '../components/repo-detail/CommitStrip';
import { DetailTabs } from '../components/repo-detail/DetailTabs';
import { Skeleton } from '../components/ui/Skeleton';
function PageBreadcrumb({ owner, name }: { owner: string; name: string }) {
  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="m-0 flex list-none items-center gap-1.5 p-0 font-mono text-[12.5px] flex-nowrap min-w-0 text-subtle">
        <li className="shrink-0 inline-flex items-center gap-1.5">
          <Link
            to="/repos"
            className="hover:text-foreground transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            repos
          </Link>
        </li>
        <li role="presentation" aria-hidden="true" className="shrink-0">/</li>
        <li className="shrink-0 min-w-0 max-w-[100px] sm:max-w-[180px] inline-flex items-center gap-1.5">
          <span className="truncate block">{shortDid(owner)}</span>
        </li>
        <li role="presentation" aria-hidden="true" className="text-muted shrink-0">/</li>
        <li className="min-w-0 inline-flex items-center gap-1.5">
          <span className="text-foreground truncate block">{name}</span>
        </li>
      </ol>
    </nav>
  );
}

function StatusShell({ owner, name, title, message }: {
  owner: string;
  name: string;
  title: string;
  message: string;
}) {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageBreadcrumb owner={owner} name={name} />
      <div className="border-t border-border py-16">
        <h1 className="m-0 text-[28px] font-[540] tracking-[-0.03em] text-foreground">{title}</h1>
        <p className="m-0 mt-2 text-[15px] text-muted">{message}</p>
        <Link
          to="/repos"
          className="mt-6 inline-block text-[14px] text-foreground underline decoration-[var(--rule-2)] underline-offset-4 hover:decoration-current"
        >
          ← Back to repositories
        </Link>
      </div>
    </div>
  );
}

function LoadingState({ owner, name }: { owner: string; name: string }) {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6" aria-busy="true">
      <PageBreadcrumb owner={owner} name={name} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-10 mb-8 sm:mb-10">
        <div>
          <Skeleton className="h-10 w-2/3 mb-4" />
          <div className="flex gap-1.5 mb-5">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-4 w-full max-w-[480px] mb-2" />
          <Skeleton className="h-4 w-3/4 max-w-[360px] mb-7" />
          <Skeleton className="h-[104px] w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-[110px] w-full" />
          <Skeleton className="h-[130px] w-full" />
        </div>
      </div>
      <Skeleton className="h-12 w-full mb-8" />
      <div className="space-y-px">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
      </div>
    </div>
  );
}

const TAB_IDS = ['code', 'commits', 'pulls', 'issues', 'certs', 'events'];

export default function RepositoryDetailPage() {
  const { owner = '', name = '' } = useParams<{ owner: string; name: string }>();
  const { repo, notFound, loading, error, partialError } = useRepository(owner, name);
  useRepositorySocialMetadata(repo);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') ?? 'code';
  const tab = TAB_IDS.includes(rawTab) ? rawTab : 'code';
  const fileOpen = tab === 'code'
    && Boolean(normalizeRepoPath(searchParams.get('file') ?? ''));

  // Switching tabs drops the code-navigation params
  const setTab = useCallback(
    (t: string) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (t === 'code') next.delete('tab');
        else next.set('tab', t);
        for (const key of ['path', 'file', 'view', 'force']) next.delete(key);
        return next;
      });
    },
    [setSearchParams],
  );

  const { openModal, setOpenModal } = useShortcuts();

  const openFile = useCallback(
    (path: string) => {
      setSearchParams(prev => new URLSearchParams(buildRepoCodeSearch(prev, { file: path })));
    },
    [setSearchParams],
  );

  // Keyboard: 1–6 switch tabs, t opens the file finder (once the repo loaded)
  useShortcut('1', () => setTab(TAB_IDS[0]));
  useShortcut('2', () => setTab(TAB_IDS[1]));
  useShortcut('3', () => setTab(TAB_IDS[2]));
  useShortcut('4', () => setTab(TAB_IDS[3]));
  useShortcut('5', () => setTab(TAB_IDS[4]));
  useShortcut('6', () => setTab(TAB_IDS[5]));
  useShortcut('t', e => {
    if (!repo) return;
    e.preventDefault();
    setOpenModal('finder');
  });

  if (loading) return <LoadingState owner={owner} name={name} />;
  if (error) return <StatusShell owner={owner} name={name} title="Failed to load repository" message={error} />;
  if (notFound || !repo) {
    return (
      <StatusShell
        owner={owner}
        name={name}
        title="Repository not found"
        message={`${shortDid(owner)}/${name} does not exist on this node.`}
      />
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PageBreadcrumb owner={owner} name={name} />

      {partialError && (
        <p className="m-0 mb-5 border-l-2 border-danger pl-3 py-1 text-[13.5px] text-danger">
          {partialError}. Some sections may appear empty.
        </p>
      )}

      {/* Header runs full width, as a repository page header does. Stars,
          updated, and created live in it rather than in a metric grid. */}
      <DetailHeader repo={repo} />

      {repo.latestCommit && <CommitStrip commit={repo.latestCommit} />}

      {/* An open file is the primary workspace and takes the full width. The
          clone panel returns when the visitor goes back to repository browsing. */}
      <div className={cn(
        'mt-6 grid gap-x-12 gap-y-8',
        !fileOpen && 'lg:grid-cols-[minmax(0,1fr)_300px]',
      )}>
        <div className="min-w-0">
          <DetailTabs
            repo={repo}
            value={tab}
            onValueChange={setTab}
            onOpenFinder={() => setOpenModal('finder')}
          />
        </div>

        {!fileOpen && (
          <aside className="min-w-0 flex flex-col gap-6">
            <ClonePanel
              cloneUrl={repo.cloneUrl}
              remoteUrl={`gitlawb://${didKeySegment(repo.owner)}/${repo.name}`}
              onNavigate={setTab}
            />
          </aside>
        )}
      </div>

      <FileFinder
        repo={repo}
        open={openModal === 'finder'}
        onClose={() => setOpenModal(null)}
        onOpenFile={openFile}
      />
    </div>
  );
}
