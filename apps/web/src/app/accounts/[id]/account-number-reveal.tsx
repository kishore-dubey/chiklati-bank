"use client";

import { useState } from "react";

export function AccountNumberReveal({ accountNumber }: { accountNumber: string }): React.ReactElement {
  const [revealed, setRevealed] = useState(false);

  return (
    <span>
      {revealed ? accountNumber : `•••${accountNumber.slice(-4)}`}{" "}
      <button type="button" onClick={() => setRevealed((current) => !current)}>
        {revealed ? "Hide" : "Reveal"}
      </button>
    </span>
  );
}
