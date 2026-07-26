"use client";

import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import RefreshIcon from "@mui/icons-material/Refresh";

export function RefreshButton(): React.ReactElement {
  const router = useRouter();

  return (
    <Tooltip title="Refresh">
      <IconButton onClick={() => router.refresh()} size="small" color="primary">
        <RefreshIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
