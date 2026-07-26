import { alpha } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";

export function SandboxPanel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mt: 2,
        borderStyle: "dashed",
        borderColor: "warning.main",
        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
        <ScienceOutlinedIcon fontSize="small" color="warning" />
        <Typography variant="overline" color="warning.dark" sx={{ lineHeight: 1 }}>
          Sandbox tools
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}
