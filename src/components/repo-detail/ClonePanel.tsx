import { Button } from '../register/controls';
import { CopyButton } from '../ui/CopyButton';
import { Section } from '../register/primitives';
import { isHttpUrl } from '../../lib/api';

interface ClonePanelProps {
  /** The node's https clone URL — plain git handles this one. */
  cloneUrl: string;
  /** Canonical gitlawb:// remote, when the owner key and name are known. */
  remoteUrl?: string;
  onNavigate: (tab: string) => void;
}

/** Sidebar clone block. A section, not a card — it holds no list of rows. */
export function ClonePanel({ cloneUrl, remoteUrl, onNavigate }: ClonePanelProps) {
  const primary = remoteUrl ?? cloneUrl;
  const command = remoteUrl ? `git clone "${remoteUrl}"` : `git clone ${cloneUrl}`;

  return (
    <Section
      title="Clone"
      action={<CopyButton value={command} label="Copy" srLabel="Copy the clone command" />}
    >
      <pre className="m-0 whitespace-pre-wrap break-all bg-canvas-inset p-3 font-mono text-[12px] leading-[1.6] text-foreground">
        <span className="select-none text-subtle">$ </span>
        git clone {remoteUrl ? `"${primary}"` : primary}
      </pre>

      {remoteUrl && (
        <p className="m-0 mt-2.5 text-[12.5px] leading-relaxed text-subtle">
          The <code className="font-mono">gitlawb://</code> scheme requires the{' '}
          <code className="font-mono">git-remote-gitlawb</code> helper. Plain{' '}
          <code className="font-mono">git</code> can clone the same repository
          {/* clone_url comes from the node, not this app: it only becomes a
              link when it is plain http(s). The sentence stands either way. */}
          {isHttpUrl(cloneUrl) && (
            <>
              {' '}over{' '}
              <a
                href={cloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline decoration-[var(--rule-2)] hover:decoration-current"
              >
                https
              </a>
            </>
          )}
          .
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <Button variant="outline" fullWidth onPress={() => onNavigate('code')}>
          Browse code
        </Button>
        <Button variant="outline" fullWidth onPress={() => onNavigate('certs')}>
          Certificates
        </Button>
      </div>
    </Section>
  );
}
