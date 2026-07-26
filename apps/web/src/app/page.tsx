import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function HomePage(): React.ReactElement {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Paper variant="outlined" sx={{ p: 5, textAlign: "center", maxWidth: 440 }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <AccountBalanceIcon sx={{ fontSize: 48, color: "primary.main" }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Chiklati Bank
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Business banking, built on Unit.
          </Typography>
          <Button href="/dashboard" variant="contained" size="large">
            Go to dashboard
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
