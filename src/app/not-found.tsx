import Link from "next/link";
import { EditorialShell } from "@/components/EditorialShell";

export default function NotFound() {
  return <EditorialShell current="Not found"><article className="panel-document"><header className="document-header"><p>404</p><h1>Not here</h1></header><section className="panel-introduction"><p><Link href="/people">Meet someone instead →</Link></p></section></article></EditorialShell>;
}
