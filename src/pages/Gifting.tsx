import { PageHeader, Section, Panel, KeyRow, Note } from "../components/ui/layout";
import { PageIcon } from "../components/PageIcon";
import { SourceCite } from "../components/ui/SourceCite";
import { Formula, Fx } from "../components/ui/Formula";
import { Gold, Brains, Xp } from "../components/ui/Currency";
import { social } from "../data";
import { num, pct } from "../lib/format";

const g = social.gift;

/** One row of the reward table, rendered with the right currency chip. */
function RewardValue({ kind, amount }: { kind: string; amount: number }) {
  return kind === "brain" ? <Brains value={amount} /> : <Gold value={amount} />;
}

export function GiftingPage() {
  return (
    <div>
      <PageHeader title="Gifting" icon={<PageIcon to="/gifting" />} kicker={`${g.freeDaily} free a day · up to ${g.maxFriends} friends`}>
        <p>
          You can send one gift a day to each friend. What a gift contains is decided by a weighted roll{" "}
          <strong>at the moment it is sent</strong> — it is stored on the gift and never re-rolled, so opening it later
          can't change what was already inside. Neither the sender nor the recipient sees the contents until it's opened.
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
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td className="text-muted">Total</td>
                <td className="text-right tabular text-muted">{g.totalWeight}</td>
                <td className="text-right tabular">{pct(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-1">
          <SourceCite file="server/src/logic.ts" line={116} label="GIFT_REWARD_TABLE" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Panel>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Per gift opened</h3>
            <KeyRow label="Average gold">
              <Formula result={num(g.evGold)} source={{ file: "server/src/logic.ts", line: 116, label: "GIFT_REWARD_TABLE" }}>
                {g.rewards
                  .filter((r) => r.kind === "gold")
                  .map((r) => (
                    <Fx key={r.amount}>
                      {pct(r.chance)} × {num(r.amount)} = {num(r.chance * r.amount)}
                    </Fx>
                  ))}
                <Fx>total = {num(g.evGold)} gold</Fx>
              </Formula>
            </KeyRow>
            <KeyRow label="Chance of a brain">{pct(g.brainChance)}</KeyRow>
            <p className="mt-2 text-xs text-muted">
              Ignoring the daily floor below. Gold is by far the common case — {pct(1 - g.brainChance)} of gifts pay gold.
            </p>
          </Panel>

          <Panel>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">The daily brain floor</h3>
            <p className="text-sm">
              The <strong>first gift you open each UTC day</strong> always pays{" "}
              <Brains value={g.firstDaily.amount} /> — whatever the sender actually rolled onto it. Every later gift that
              day pays its own stored contents.
            </p>
            <p className="mt-2 text-xs text-muted">
              So one brain a day is guaranteed as long as someone gifts you, and the {pct(g.brainChance)} roll only
              matters for the second gift onward. Open your gifts one at a time if you want to know which is which.
            </p>
            <div className="mt-2">
              <SourceCite file="server/src/logic.ts" line={133} label="FIRST_DAILY_GIFT_REWARD" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section title="Sending">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Cost</h3>
            <KeyRow label="Free sends per UTC day">{g.freeDaily}</KeyRow>
            <KeyRow label="Each one after that">
              <Gold value={g.goldCost} />
            </KeyRow>
            <KeyRow label="XP you earn per send">
              <Xp value={g.xpReward} />
            </KeyRow>
            <p className="mt-2 text-xs text-muted">
              There is no cap on how many different friends you can gift in a day — gold is the only limit. The free
              sends come off the front of the day, not the front of a batch, so once you've used both, every gift in a
              "Gift all" costs {num(g.goldCost)}.
            </p>
            <div className="mt-2">
              <SourceCite file="src/net/protocol.ts" line={321} label="FREE_DAILY_GIFTS" />
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Who you can send to</h3>
            <p className="text-sm">A send is refused when either of these is true of that friend:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>· You already gifted them today (same UTC day).</li>
              <li>· They still have an unopened gift from you sitting in their inbox.</li>
            </ul>
            <p className="mt-2 text-xs text-muted">
              Both rules are per-recipient, not per-sender, and the server enforces them — so a friend who never opens
              their gifts blocks only your gifts to them.
            </p>
            <div className="mt-2">
              <SourceCite file="server/src/db.ts" line={508} label="gift send rules" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section title="Limits">
        <Panel>
          <KeyRow label="Maximum friends">{num(g.maxFriends)}</KeyRow>
          <KeyRow label="Unopened gifts your inbox holds">{num(g.maxInbox)}</KeyRow>
          <p className="mt-2 text-xs text-muted">
            Once the inbox is full, further gifts to you are refused until you open some. The friend cap bounds
            accepting new friends, not receiving gifts from ones you already have.
          </p>
        </Panel>
      </Section>

      <Note>
        Gifting is server-owned: every send is validated and charged by the backend, and the contents are rolled there
        with crypto randomness. Nothing about a gift can be predicted or influenced from the client.
      </Note>
    </div>
  );
}
