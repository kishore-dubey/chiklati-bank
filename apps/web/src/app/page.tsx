import Link from "next/link";

export default function HomePage(): React.ReactElement {
  return (
    <main>
      <h1>Chiklati Bank</h1>
      <p>Business banking MVP, built on Unit.</p>
      <Link href="/dashboard">Go to dashboard</Link>
    </main>
  );
}
