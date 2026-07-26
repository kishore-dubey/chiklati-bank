import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { OnboardingForm } from "./onboarding-form";

export default function OnboardingPage(): React.ReactElement {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Open an account
      </Typography>
      <OnboardingForm />
    </Stack>
  );
}
