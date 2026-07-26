import Link from "next/link";
import { callInternalApi } from "@/lib/internal-api";
import type { CardResponse } from "@chiklati/shared";
import { DebitCardVisual } from "@/components/DebitCardVisual";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";

export default async function CardsPage(): Promise<React.ReactElement> {
  const result = await callInternalApi<CardResponse[]>("/cards", { method: "GET" });
  const cards = result.status === 200 ? result.body : [];

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Cards
        </Typography>
        <Button href="/cards/new" variant="contained" startIcon={<AddIcon />}>
          Issue a card
        </Button>
      </Stack>

      {cards.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography color="text.secondary">No cards yet.</Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
            gap: 3,
          }}
        >
          {cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`} style={{ textDecoration: "none" }}>
              <DebitCardVisual
                last4Digits={card.last4Digits}
                expirationDate={card.expirationDate}
                type={card.type}
                status={card.status}
              />
            </Link>
          ))}
        </Box>
      )}
    </Stack>
  );
}
