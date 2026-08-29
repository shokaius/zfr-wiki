import { currencyIcon, CURRENCY_ICON } from "../../lib/assets";
import { num } from "../../lib/format";

type Kind = keyof typeof CURRENCY_ICON;

const LABEL: Record<Kind, string> = {
  gold: "gold",
  brains: "brains",
  xp: "XP",
  level: "level",
  zombie: "zombies",
};

export function Currency({
  kind,
  value,
  digits,
  className = "",
  showIcon = true,
}: {
  kind: Kind;
  value: number | null | undefined;
  digits?: number;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1 tabular whitespace-nowrap ${className}`}>
      {showIcon && (
        <img
          src={currencyIcon(kind)}
          alt=""
          width={16}
          height={16}
          className="inline-block h-4 w-4 object-contain"
          aria-hidden="true"
        />
      )}
      <span>{num(value, digits !== undefined ? { digits } : undefined)}</span>
      <span className="sr-only"> {LABEL[kind]}</span>
    </span>
  );
}

export const Gold = (p: Omit<Parameters<typeof Currency>[0], "kind">) => <Currency kind="gold" {...p} />;
export const Brains = (p: Omit<Parameters<typeof Currency>[0], "kind">) => <Currency kind="brains" {...p} />;
export const Xp = (p: Omit<Parameters<typeof Currency>[0], "kind">) => <Currency kind="xp" {...p} />;
