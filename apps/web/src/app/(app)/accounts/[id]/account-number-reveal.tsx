"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export function AccountNumberReveal({ accountNumber }: { accountNumber: string }): React.ReactElement {
  const [revealed, setRevealed] = useState(false);

  return (
    <>
      {revealed ? accountNumber : `•••${accountNumber.slice(-4)}`}{" "}
      <Tooltip title={revealed ? "Hide" : "Reveal"}>
        <IconButton size="small" onClick={() => setRevealed((current) => !current)}>
          {revealed ? <VisibilityOffIcon fontSize="inherit" /> : <VisibilityIcon fontSize="inherit" />}
        </IconButton>
      </Tooltip>
    </>
  );
}
