import Link from "next/link";
import { auth } from "@/auth";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth();

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {session?.user?.email}</p>
      <Link href="/onboarding">Open an account</Link>
    </main>
  );
}
