import Link from "next/link";
import { callInternalApi } from "@/lib/internal-api";
import type { PaymentResponse } from "@chiklati/shared";
import { StatusChip } from "@/components/StatusChip";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

export default async function PaymentsPage(): Promise<React.ReactElement> {
  const result = await callInternalApi<PaymentResponse[]>("/payments", { method: "GET" });
  const payments = result.status === 200 ? result.body : [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Payments
        </Typography>
        <Button href="/payments/new" variant="contained" startIcon={<AddIcon />}>
          Send a payment
        </Button>
      </Stack>

      {payments.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography color="text.secondary">No payments yet.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rail</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <Link href={`/payments/${payment.id}`}>{payment.rail}</Link>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={payment.status} />
                  </TableCell>
                  <TableCell align="right">${formatCents(payment.amount)}</TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
