import type { RaidSettings } from "../lib/raidEv";
import { pct } from "../lib/format";

export function RaidToggleBar({ s, patch }: { s: RaidSettings; patch: (p: Partial<RaidSettings>) => void }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-border bg-surface-2 p-3 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Assumptions</span>

      <label className="flex items-center gap-2">
        <span className="text-muted">Golden Dice</span>
        <select
          value={s.dice}
          onChange={(e) => patch({ dice: Number(e.target.value) })}
          className="rounded border border-border bg-surface px-1.5 py-1 tabular"
        >
          {[0, 1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label
        className={`flex items-center gap-1.5 ${s.elite ? "opacity-50" : "cursor-pointer"}`}
        title={s.elite ? "The Brain Ticket already skips the cooldown, so no voucher is needed." : undefined}
      >
        <input
          type="checkbox"
          checked={s.useVoucher && !s.elite}
          disabled={s.elite}
          onChange={(e) => patch({ useVoucher: e.target.checked })}
        />
        <span>Use Voucher{s.elite && <span className="ml-1 text-xs text-muted">(covered by ticket)</span>}</span>
      </label>

      <label className="flex cursor-pointer items-center gap-1.5">
        <input type="checkbox" checked={s.sellDecor} onChange={(e) => patch({ sellDecor: e.target.checked })} />
        <span>Sell decorations</span>
      </label>

      <label className="flex cursor-pointer items-center gap-1.5">
        <input type="checkbox" checked={s.elite} onChange={(e) => patch({ elite: e.target.checked })} />
        <span>Elite (Brain Ticket)</span>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-muted">Survival {pct(s.survival, 0)}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(s.survival * 100)}
          onChange={(e) => patch({ survival: Number(e.target.value) / 100 })}
          className="w-28 accent-[rgb(var(--primary))]"
        />
      </label>
    </div>
  );
}
