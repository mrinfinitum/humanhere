import type { Metadata } from "next";
import { FollowList } from "../FollowList";

type ListParams = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: ListParams }): Promise<Metadata> {
  const { username } = await params;
  return { title: `People following @${username.toLowerCase()}`, robots: { index: false } };
}

export default function FollowersPage({ params }: { params: ListParams }) {
  return <FollowList params={params} direction="followers" />;
}
