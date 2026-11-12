import { useNetwork } from '../hooks/useNetwork';
import { FEDERATED_NODES } from '../lib/nodes';
import { RepoHero } from '../components/repos/RepoHero';
import { NodeTable } from '../components/network/NodeTable';
import { ReplicationTable } from '../components/network/ReplicationTable';
import { Skeleton } from '../components/ui/Skeleton';

export default function NetworkPage() {
  const { snapshots, replication } = useNetwork();

  const live = snapshots?.filter(s => s.reachable).length;
  const clusterRepos = snapshots
    ? Math.max(0, ...snapshots.map(s => s.stats?.repos ?? 0))
    : null;
  const clusterAgents = snapshots
    ? snapshots.reduce((sum, s) => sum + (s.stats?.agents ?? 0), 0)
    : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">

      <RepoHero
        totalCount={live ?? 0}
        page={1}
        perPage={FEDERATED_NODES.length}
        windowStart={1}
        windowEnd={FEDERATED_NODES.length}
        title="Network"
        countNoun="nodes live"
        description={
          <p className="m-0">
            Independent nodes replicating repositories to each other. Each push is certified on
            its origin node, announced on the{' '}
            <code className="font-mono text-[14px] text-foreground">gitlawb/ref-updates/v1</code>{' '}
            gossip topic, and picked up by every peer. Below is the same feed as each node sees
            it, and how far each one lags.
          </p>
        }
        cells={[
          {
            label: 'nodes live',
            value: live !== undefined ? `${live}/${FEDERATED_NODES.length}` : '—',
          },
          { label: 'cluster repos', value: clusterRepos !== null && clusterRepos > 0 ? clusterRepos.toLocaleString() : '—' },
          { label: 'cluster agents', value: clusterAgents !== null && clusterAgents > 0 ? clusterAgents.toLocaleString() : '—' },
          {
            label: 'replication',
            value: replication ? `${replication.coveragePercent}%` : '—',
          },
        ]}
      />

      <div className="pt-4 pb-20 flex flex-col gap-12">

        <section>
          <div className="mb-4 border-b border-border pb-2">
            <h2 className="m-0 text-[17px] font-[540] tracking-[-0.015em] text-foreground">Nodes</h2>
          </div>
          <NodeTable
            snapshots={snapshots}
            replication={replication}
            skeletonCount={FEDERATED_NODES.length}
          />
        </section>

        {/* Replication */}
        {replication ? (
          <ReplicationTable
            replication={replication}
            labels={(snapshots ?? [])
              .filter(s => s.events !== null)
              .map(s => s.node.label)}
          />
        ) : snapshots === null ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="border-t border-border py-12">
            <p className="m-0 text-[14px] text-muted">
              Replication analysis needs event feeds from at least two nodes.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
