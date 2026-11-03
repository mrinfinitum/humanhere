import type { Metadata } from "next";
import { FollowList } from "../FollowList";

type ListParams = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: ListParams }): Promise<Metadata> {
  const { username } = await params;
  return { title: `People @${username.toLowerCase()} follows`, robots: { index: false } };
}

export default function FollowingPage({ params }: { params: ListParams }) {
  return <FollowList params={params} direction="following" />;
}
