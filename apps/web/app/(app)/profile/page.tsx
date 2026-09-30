import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { CreditCard } from "lucide-react";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import {
  getCurrentBillingPeriodUsage,
  groupUsageIntoSessions,
  listRecentUsageEvents,
  type UsageSession,
} from "@/lib/usage";
import { formatBytes, formatDurationMs, relativeTime } from "@/lib/dashboard/stats";
import type { AppearanceColors } from "@/lib/appearance";
import Card from "@/components/ui/Card";
import StatTile from "@/components/dashboard/StatTile";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import SetPasswordForm from "@/components/auth/SetPasswordForm";
import DeleteAccountForm from "@/components/auth/DeleteAccountForm";
import DeactivateAccountForm from "@/components/settings/DeactivateAccountForm";
import ProfileForm from "@/components/settings/ProfileForm";
import AvatarUpload from "@/components/settings/AvatarUpload";
import EmailChangeForm from "@/components/settings/EmailChangeForm";
import TwoFactorSettings from "@/components/settings/TwoFactorSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import UpgradeButton from "@/components/settings/UpgradeButton";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Settings | FileForge",
};

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "billing", label: "Usage & Billing" },
  { key: "appearance", label: "Appearance" },
  { key: "danger", label: "Danger zone" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?next=/profile");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (!user) {
    redirect("/login?next=/profile");
  }

  const { tab: rawTab } = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : "profile";

  const hasPassword = Boolean(user.passwordHash);
  const isGoogle = Boolean(user.googleId);
  const twoFactorEnabled = Boolean(user.totpEnabledAt);
  const displayName = user.name?.trim() || user.email.split("@")[0]!;
  const appearanceColors: AppearanceColors | null =
    user.themeBackground && user.themeAccent && user.themeText
      ? { background: user.themeBackground, accent: user.themeAccent, text: user.themeText }
      : null;

  return (
    <WorkspaceShell title="Settings" subtitle={user.email}>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface-elevated p-5">
        <AvatarUpload hasAvatar={Boolean(user.avatarBlobPath)} displayName={displayName} />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-ink">{displayName}</p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          {hasPassword && (
            <span className="rounded-md bg-steel-soft px-3 py-1 text-xs font-medium text-steel">
              Email &amp; password
            </span>
          )}
          {isGoogle && (
            <span className="rounded-md bg-ember-soft px-3 py-1 text-xs font-medium text-ember-deep">
              Google connected
            </span>
          )}
          {twoFactorEnabled && (
            <span className="rounded-md bg-success-soft px-3 py-1 text-xs font-medium text-success">
              2FA on
            </span>
          )}
        </div>
      </div>

      <nav
        aria-label="Settings sections"
        className="mt-5 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={t.key === "profile" ? "/profile" : `/profile?tab=${t.key}`}
              className={cn(
                "shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-ember text-ember-deep"
                  : "border-transparent text-ink-muted hover:text-ink"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex flex-col gap-4">
        {tab === "profile" && (
          <>
            <Card className="rounded-2xl p-6">
              <h2 className="font-display mb-1 text-base font-bold text-ink">Profile</h2>
              <p className="mb-5 text-sm text-ink-muted">
                Your name and photo are shown in the account menu.
              </p>
              <ProfileForm initialName={user.name ?? ""} />
            </Card>

            <Card className="rounded-2xl p-6">
              <h2 className="font-display mb-1 text-base font-bold text-ink">Email</h2>
              <p className="mb-5 text-sm text-ink-muted">
                Currently <span className="font-medium text-ink">{user.email}</span>. Changing
                it requires verifying the new address.
              </p>
              <EmailChangeForm hasPassword={hasPassword} currentEmail={user.email} />
            </Card>
          </>
        )}

        {tab === "security" && (
          <>
            <Card className="rounded-2xl p-6">
              {hasPassword ? (
                <>
                  <h2 className="font-display mb-1 text-base font-bold text-ink">
                    Change password
                  </h2>
                  <p className="mb-5 text-sm text-ink-muted">
                    Updating your password signs you out everywhere.
                  </p>
                  <ChangePasswordForm />
                </>
              ) : (
                <>
                  <h2 className="font-display mb-1 text-base font-bold text-ink">
                    Create a password
                  </h2>
                  <p className="mb-5 text-sm text-ink-muted">
                    This account signs in with Google. Add a password to also sign in
                    with your email address &mdash; Continue with Google keeps working.
                  </p>
                  <SetPasswordForm />
                </>
              )}
            </Card>

            <Card className="rounded-2xl p-6">
              <h2 className="font-display mb-1 text-base font-bold text-ink">
                Two-factor authentication
              </h2>
              <p className="mb-5 text-sm text-ink-muted">
                Require a code from an authenticator app, in addition to your
                password or Google sign-in.
              </p>
              <TwoFactorSettings enabled={twoFactorEnabled} hasPassword={hasPassword} />
            </Card>
          </>
        )}

        {tab === "billing" && <UsageBillingTab userId={user.id} />}

        {tab === "appearance" && (
          <Card className="rounded-2xl p-6">
            <h2 className="font-display mb-1 text-base font-bold text-ink">Appearance</h2>
            <p className="mb-5 text-sm text-ink-muted">
              Pick a preset or build your own. Light/Dark is saved on this
              browser; a custom palette is saved to your account.
            </p>
            <AppearanceSettings initialColors={appearanceColors} />
          </Card>
        )}

        {tab === "danger" && (
          <>
            <Card className="rounded-2xl p-6">
              <h2 className="font-display mb-1 text-base font-bold text-ink">
                Deactivate account
              </h2>
              <p className="mb-5 text-sm text-ink-muted">
                Take a break without losing anything. Signs you out everywhere and
                pauses your API keys until you sign in again.
              </p>
              <DeactivateAccountForm hasPassword={hasPassword} />
            </Card>

            <Card className="rounded-2xl border-danger/20 p-6">
              <h2 className="font-display mb-1 text-base font-bold text-ink">
                Delete account
              </h2>
              <p className="mb-5 text-sm text-ink-muted">
                Permanently delete your account and conversion history.
              </p>
              <DeleteAccountForm hasPassword={hasPassword} />
            </Card>
          </>
        )}
      </div>
    </WorkspaceShell>
  );
}

const ACTIVITY_EVENT_LIMIT = 300;
const ACTIVITY_SESSION_LIMIT = 15;

const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

/** "Sep 28, 11:09 AM", or "Sep 23, 11:05 – 11:23 PM" when the session spans time. */
function formatSessionRange({ start, end }: UsageSession): string {
  const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = (d: Date) => d.toLocaleTimeString("en-US", TIME_FORMAT);
  if (end.getTime() - start.getTime() < 60_000) return `${day(end)}, ${time(end)}`;
  if (day(start) !== day(end)) return `${day(start)}, ${time(start)} – ${day(end)}, ${time(end)}`;
  // Same day: drop the start's AM/PM when both ends share it.
  const [startClock, startPeriod] = time(start).split(" ");
  const endLabel = time(end);
  const startLabel = endLabel.endsWith(startPeriod) ? startClock : time(start);
  return `${day(end)}, ${startLabel} – ${endLabel}`;
}

async function UsageBillingTab({ userId }: { userId: string }) {
  const [{ periodEnd, usage }, events] = await Promise.all([
    getCurrentBillingPeriodUsage(userId),
    listRecentUsageEvents(userId, ACTIVITY_EVENT_LIMIT),
  ]);
  const sessions = groupUsageIntoSessions(events, {
    truncated: events.length === ACTIVITY_EVENT_LIMIT,
  }).slice(0, ACTIVITY_SESSION_LIMIT);
  const showApiColumn = sessions.some((s) => s.totals.api_request > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display mb-3 text-base font-bold text-ink">Spending</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface-elevated p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Current plan
            </p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-ink">Free</span>
              <span className="text-sm text-ink-muted">$0/mo</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Resets {periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
            <Link
              href="/?view=marketing#pricing"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-steel-soft"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Adjust plan
            </Link>
          </div>

          <div className="rounded-2xl border border-ember/30 bg-ember-soft/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ember-deep">
              Upgrade available
            </p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-ink">Pro</span>
              <span className="text-sm text-ink-muted">$20/mo</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">Higher limits and priority processing.</p>
            {/*
              No billing processor exists yet — this is a deliberately
              placeholder card, built ahead of the real thing at the user's
              explicit request. It must never claim a purchase succeeded.
            */}
            <UpgradeButton />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold text-ink">Usage this month</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Files processed" value={String(usage.file_processed.amount)} />
          <StatTile label="API requests" value={String(usage.api_request.amount)} />
          <StatTile
            label="Processing time"
            value={formatDurationMs(usage.processing_time.amount)}
          />
          <StatTile label="Bandwidth" value={formatBytes(usage.bandwidth.amount)} />
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          For trends and a breakdown by format, see the{" "}
          <Link href="/dashboard" className="font-medium text-ember-deep hover:underline">
            dashboard
          </Link>
          .
        </p>
      </div>

      <div>
        <h2 className="font-display mb-3 text-base font-bold text-ink">Recent activity</h2>
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-10 text-center text-sm text-ink-muted">
            Nothing metered yet — convert a file or call the API to see it here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface-elevated">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Session</th>
                  <th className="px-4 py-2.5 text-right font-medium">Files</th>
                  {showApiColumn && (
                    <th className="px-4 py-2.5 text-right font-medium">API requests</th>
                  )}
                  <th className="px-4 py-2.5 text-right font-medium">Bandwidth</th>
                  <th className="px-4 py-2.5 text-right font-medium">Processing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink">
                      <span title={`${session.start.toISOString()} – ${session.end.toISOString()}`}>
                        {formatSessionRange(session)}
                      </span>
                      <span className="text-ink-muted"> · {relativeTime(session.end)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                      {session.totals.file_processed}
                    </td>
                    {showApiColumn && (
                      <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                        {session.totals.api_request}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                      {formatBytes(session.totals.bandwidth)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                      {formatDurationMs(session.totals.processing_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
