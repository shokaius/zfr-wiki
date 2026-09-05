import { PageHeader, Section } from "../components/ui/layout";
import { PageIcon } from "../components/PageIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { Gold, Brains } from "../components/ui/Currency";
import { social } from "../data";
import { num, pct } from "../lib/format";

const g = social.gift;

/** One row of the reward table, rendered with the right currency chip. */
function RewardValue({ kind, amount }: { kind: string; amount: number }) {
  return kind === "brain" ? <Brains value={amount} /> : <Gold value={amount} />;
}

export function SocialPage() {
  return (
    <div>
      <PageHeader title="Social" icon={<PageIcon to="/social" />} kicker={`${g.freeDaily} free gifts a day · up to ${g.maxFriends} friends`}>
        <ul className="space-y-1">
          <li>You can send one gift a day to each friend.</li>
          <li>
            The first gift you open each day (UTC) gives <Brains value={g.firstDaily.amount} />, whatever the sender
            actually rolled onto it.
          </li>
          <li>
            After that, you expect <Brains value={g.evBrains} digits={2} /> and <Gold value={g.evGold} digits={2} /> per
            gift.
          </li>
        </ul>
      </PageHeader>

      <Section title="What's inside a gift">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reward</th>
                <th className="text-right">Weight</th>
                <th className="text-right">Chance</th>
              </tr>
            </thead>
            <tbody>
              {g.rewards.map((r) => (
                <tr key={`${r.kind}-${r.amount}`}>
                  <td>
                    <RewardValue kind={r.kind} amount={r.amount} />
                  </td>
                  <td className="text-right tabular text-muted">{r.weight}</td>
                  <td className="text-right tabular font-medium">{pct(r.chance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Contents are rolled when the gift is <strong>sent</strong> and stored on it — opening never re-rolls, so
          sitting on an unopened gift can't change what's inside. Neither of you sees it until the recipient opens it.{" "}
          <SourceCite file="server/src/logic.ts" line={116} label="GIFT_REWARD_TABLE" />
        </p>
      </Section>

      <Section title="Sending">
        <div className="prose-tight max-w-3xl space-y-3 text-sm">
          <p>
            The first {g.freeDaily} gifts you send each UTC day are free; every one after that costs{" "}
            <Gold value={g.goldCost} />. There's no cap on how many different friends you can reach in a day — gold is
            the only thing that trims the list. Each send earns you {num(g.xpReward)} XP either way.
          </p>
          <p>
            The free sends come off the front of the <em>day</em>, not the front of a batch, so once you've used both,
            every gift in a "Gift all" is charged.
          </p>
          <p>
            A gift to a particular friend is refused if you already gifted them today, or if they're still holding an
            unopened gift from you. Both rules are per-recipient, so a friend who never opens anything only ever blocks
            your gifts to <em>them</em> — everyone else stays available.
          </p>
        </div>
        <div className="mt-2">
          <SourceCite file="server/src/db.ts" line={508} label="gift send rules" />
        </div>
      </Section>

      <Section title="Limits">
        <p className="max-w-3xl text-sm leading-relaxed text-text">
          You can have up to {num(g.maxFriends)} friends, and your inbox holds {num(g.maxInbox)} unopened gifts — past
          that, further gifts to you are refused until you open some. The friend cap bounds accepting new friends, not
          receiving gifts from the ones you already have.
        </p>
      </Section>
    </div>
  );
}
