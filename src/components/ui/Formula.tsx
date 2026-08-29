import type { ReactNode } from "react";
import { SourceCite } from "./SourceCite";

/** A computed value that expands to reveal its formula, inputs, and source. */
export function Formula({
  result,
  children,
  source,
  className = "",
}: {
  result: ReactNode;
  children: ReactNode;
  source?: { file: string; line?: number; label?: string };
  className?: string;
}) {
  return (
    <details className={`group inline-block align-middle ${className}`}>
      <summary className="inline-flex cursor-help list-none items-center gap-0.5 tabular decoration-dotted underline-offset-2 group-open:text-primary-strong hover:underline">
        {result}
        <span className="text-[10px] font-semibold text-primary-strong/70 group-open:text-primary-strong" aria-hidden="true">
          ƒ
        </span>
      </summary>
      <div className="mt-1.5 max-w-md rounded-md border border-border bg-surface-2 p-2.5 text-xs font-normal not-italic text-muted shadow-sm">
        <div className="space-y-1 font-mono leading-relaxed text-text">{children}</div>
        {source && (
          <div className="mt-2 border-t border-border/60 pt-1.5">
            <SourceCite {...source} />
          </div>
        )}
      </div>
    </details>
  );
}

export function Fx({ children }: { children: ReactNode }) {
  return <div className="whitespace-pre-wrap break-words">{children}</div>;
}
