import { sourceUrl } from "../../lib/gameMeta";

/** Link to a source symbol in the pinned game repo. */
export function SourceCite({ file, line, label }: { file: string; line?: number; label?: string }) {
  return (
    <a
      href={sourceUrl(file, line)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-[11px] text-muted hover:text-primary-strong"
      title="View source at the pinned game commit"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      {label ?? file}
      {line ? `:${line}` : ""}
    </a>
  );
}
