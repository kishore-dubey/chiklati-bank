"use client";

import { useRouter } from "next/navigation";

export function RefreshButton(): React.ReactElement {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.refresh()}>
      Refresh
    </button>
  );
}
