import { Suspense } from "react";
import { connection } from "next/server";
import { getAccountActivity } from "@/lib/account/queries";
import { getAccountRole, requireMember } from "@/lib/auth/server";
import { submissionRepository } from "@/lib/submissions/repository";
import { ACCOUNT_TABS, AccountView, type AccountTab } from "./AccountView";

type AccountSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function AccountContent({ searchParams }: { searchParams: AccountSearchParams }) {
  await connection();
  const user = await requireMember("/account");
  const { tab: requestedTab, error } = await searchParams;
  const tab = ACCOUNT_TABS.find(item => item === requestedTab) ?? "stories" satisfies AccountTab;
  const [submissions, role, activity] = await Promise.all([
    submissionRepository.listOwned(user.id),
    getAccountRole(user.id),
    getAccountActivity(user.id),
  ]);
  return <AccountView email={user.email} fallbackName={user.name ?? ""} role={role} tab={tab} error={typeof error === "string" ? error : undefined} submissions={submissions} activity={activity} />;
}

export default function AccountPage({ searchParams }: { searchParams: AccountSearchParams }) {
  return <Suspense fallback={<main className="member-shell member-loading"><span>HUMAN<i>:</i>HERE</span><b>Opening My HUMAN:HERE</b></main>}><AccountContent searchParams={searchParams} /></Suspense>;
}
