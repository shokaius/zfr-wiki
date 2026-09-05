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
      <PageHeader title="Social" icon={<PageIcon to="/social" />}>
        <p>
          You can send one gift a day to each friend. The first gift opened each day (UTC) gives{" "}
          <Brains value={g.firstDaily.amount} />. After that, you expect <Brains value={g.evBrains} digits={2} /> and{" "}
          <Gold value={g.evGold} digits={2} /> per gift.
        </p>
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
          Contents are rolled when the gift is <strong>sent</strong> and stored on it, so opening never re-rolls and
          sitting on an unopened gift can't change what's inside. Neither of you sees it until the recipient opens it.{" "}
          <SourceCite file="server/src/logic.ts" label="GIFT_REWARD_TABLE" />
        </p>
      </Section>

      <Section title="Sending">
        <div className="prose-tight max-w-3xl space-y-3 text-sm">
          <p>
            The first {g.freeDaily} gifts you send each UTC day are free; after that each costs{" "}
            <Gold value={g.goldCost} />. There's no daily cap, only what you can afford. Every send earns you{" "}
            {num(g.xpReward)} XP.
          </p>
          <p>
            The free sends count from the start of the day, not the start of a batch. Once you've used both, "Gift all"
            charges for every friend it reaches.
          </p>
          <p>
            You can't gift a friend twice in one day, or send again while they still hold an unopened gift from you.
            Both rules apply per friend, not to your whole list.
          </p>
        </div>
        <div className="mt-2">
          <SourceCite file="server/src/db.ts" label="sendGiftWithReward" />
        </div>
      </Section>

      <Section title="Limits">
        <p className="max-w-3xl text-sm leading-relaxed text-text">
          You can have up to {num(g.maxFriends)} friends, and your inbox holds {num(g.maxInbox)} unopened gifts. Past
          that, further gifts to you are refused until you open some. The friend cap limits accepting new friends, not
          receiving gifts from the ones you already have.
        </p>
      </Section>
    </div>
  );
}
