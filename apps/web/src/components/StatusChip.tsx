import Chip from "@mui/material/Chip";
import type { ChipProps } from "@mui/material/Chip";

const SUCCESS_STATUSES = new Set(["Active", "Approved", "Sent", "Open", "Completed"]);
const WARNING_STATUSES = new Set([
  "Pending",
  "PendingReview",
  "AwaitingDocuments",
  "Frozen",
  "Clearing",
  "Inactive",
]);
const ERROR_STATUSES = new Set([
  "Rejected",
  "Denied",
  "Canceled",
  "Stolen",
  "Lost",
  "SuspectedFraud",
  "ClosedByCustomer",
  "Closed",
  "Failed",
  "Skipped",
]);

function colorFor(status: string): ChipProps["color"] {
  if (SUCCESS_STATUSES.has(status)) {
    return "success";
  }
  if (WARNING_STATUSES.has(status)) {
    return "warning";
  }
  if (ERROR_STATUSES.has(status)) {
    return "error";
  }
  return "default";
}

export function StatusChip({ status }: { status: string }): React.ReactElement {
  return <Chip label={status} color={colorFor(status)} size="small" variant="filled" />;
}
