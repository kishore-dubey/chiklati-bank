"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ApplicationResponse,
  BusinessApplicationInput,
  IndividualApplicationInput,
} from "@chiklati/shared";
import { businessVerticalSchema } from "@chiklati/shared";
import { StatusChip } from "@/components/StatusChip";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

const BUSINESS_VERTICALS = businessVerticalSchema.options;

type ApplicationKind = "individual" | "business";
type SandboxOutcome = "approved" | "denied" | "pendingReview";

const TERMINAL_STATUSES = new Set(["Approved", "Denied", "Canceled"]);
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

const SANDBOX_SSN: Record<SandboxOutcome, string> = {
  approved: "123456789",
  denied: "000000001",
  pendingReview: "000000004",
};

function emptyIndividual(): IndividualApplicationInput {
  return {
    type: "individual",
    ssn: "",
    fullName: { first: "", last: "" },
    dateOfBirth: "",
    address: { street: "", city: "", state: "", postalCode: "", country: "US" },
    phone: { countryCode: "1", number: "" },
    email: "",
    occupation: "ScientistOrTechnologist",
  };
}

function sandboxIndividual(outcome: SandboxOutcome): IndividualApplicationInput {
  return {
    type: "individual",
    ssn: SANDBOX_SSN[outcome],
    fullName: { first: "Tara", last: "Wilson" },
    dateOfBirth: "1990-01-01",
    address: { street: "21 Main St", city: "Springfield", state: "IL", postalCode: "62704", country: "US" },
    phone: { countryCode: "1", number: "5555550100" },
    email: `tara.${outcome}.${Date.now()}@example.com`,
    occupation: "ScientistOrTechnologist",
  };
}

function emptyBusiness(): BusinessApplicationInput {
  return {
    type: "business",
    name: "",
    ein: "",
    businessVertical: "TechnologyMediaOrTelecom",
    entityType: "LLC",
    stateOfIncorporation: "DE",
    yearOfIncorporation: "2020",
    address: { street: "", city: "", state: "", postalCode: "", country: "US" },
    phone: { countryCode: "1", number: "" },
    contact: { fullName: { first: "", last: "" }, email: "", phone: { countryCode: "1", number: "" } },
    officer: {
      fullName: { first: "", last: "" },
      dateOfBirth: "",
      title: "CEO",
      ssn: "",
      email: "",
      phone: { countryCode: "1", number: "" },
      address: { street: "", city: "", state: "", postalCode: "", country: "US" },
      occupation: "ExecutiveOrManager",
    },
    beneficialOwners: [],
    attestedNoBeneficialOwners: true,
  };
}

function sandboxBusiness(outcome: SandboxOutcome): BusinessApplicationInput {
  const address = { street: "1 Corp Way", city: "Wilmington", state: "DE", postalCode: "19801", country: "US" };
  return {
    type: "business",
    name: `Acme Inc ${Date.now()}`,
    ein: "123456789",
    businessVertical: "TechnologyMediaOrTelecom",
    entityType: "LLC",
    stateOfIncorporation: "DE",
    yearOfIncorporation: "2020",
    address,
    phone: { countryCode: "1", number: "5555550200" },
    contact: {
      fullName: { first: "Jane", last: "Doe" },
      email: `jane.${outcome}.${Date.now()}@example.com`,
      phone: { countryCode: "1", number: "5555550201" },
    },
    officer: {
      fullName: { first: "Jane", last: "Doe" },
      dateOfBirth: "1985-05-05",
      title: "CEO",
      ssn: SANDBOX_SSN[outcome],
      email: `jane.${outcome}.${Date.now()}@example.com`,
      phone: { countryCode: "1", number: "5555550201" },
      address,
      occupation: "ExecutiveOrManager",
    },
    beneficialOwners: [],
    attestedNoBeneficialOwners: true,
  };
}

export function OnboardingForm(): React.ReactElement {
  const [kind, setKind] = useState<ApplicationKind>("individual");
  const [individual, setIndividual] = useState<IndividualApplicationInput>(emptyIndividual());
  const [business, setBusiness] = useState<BusinessApplicationInput>(emptyBusiness());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!application || !isPolling) {
      return;
    }
    if (TERMINAL_STATUSES.has(application.status) || pollCount.current >= MAX_POLLS) {
      setIsPolling(false);
      return;
    }

    const timer = setTimeout(async () => {
      pollCount.current += 1;
      const response = await fetch(`/api/applications/${application.id}`);
      if (response.ok) {
        setApplication((await response.json()) as ApplicationResponse);
      }
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [application, isPolling]);

  function fillSandboxData(outcome: SandboxOutcome): void {
    if (kind === "individual") {
      setIndividual(sandboxIndividual(outcome));
    } else {
      setBusiness(sandboxBusiness(outcome));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setApplication(null);
    pollCount.current = 0;

    const idempotencyKey = crypto.randomUUID();
    const payload = kind === "individual" ? individual : business;

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as ApplicationResponse | { error: string; details?: unknown };

      if (!response.ok) {
        setError("error" in body ? body.error : "Application submission failed");
        return;
      }

      setApplication(body as ApplicationResponse);
      setIsPolling(true);
    } catch {
      setError("Network error submitting application");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <ToggleButtonGroup
        value={kind}
        exclusive
        onChange={(_event, value: ApplicationKind | null) => value && setKind(value)}
        color="primary"
        fullWidth
      >
        <ToggleButton value="individual">Individual</ToggleButton>
        <ToggleButton value="business">Business</ToggleButton>
      </ToggleButtonGroup>

      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          Fill sandbox data:
        </Typography>
        <Button size="small" variant="outlined" color="secondary" onClick={() => fillSandboxData("approved")}>
          Approved
        </Button>
        <Button size="small" variant="outlined" color="secondary" onClick={() => fillSandboxData("denied")}>
          Denied
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => fillSandboxData("pendingReview")}
        >
          Pending Review
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {kind === "individual" ? (
              <IndividualFields value={individual} onChange={setIndividual} />
            ) : (
              <BusinessFields value={business} onChange={setBusiness} />
            )}

            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit application"}
            </Button>

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </Box>
      </Paper>

      {application ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Application status
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontWeight: 600 }}>
              {application.applicantName} ({application.type})
            </Typography>
            <StatusChip status={application.status} />
            {isPolling ? (
              <Typography variant="caption" color="text.secondary">
                checking for updates...
              </Typography>
            ) : null}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Unit application ID: {application.unitApplicationId}
          </Typography>
        </Paper>
      ) : null}
    </Stack>
  );
}

function IndividualFields({
  value,
  onChange,
}: {
  value: IndividualApplicationInput;
  onChange: (value: IndividualApplicationInput) => void;
}): React.ReactElement {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        Individual details
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="First name"
          value={value.fullName.first}
          onChange={(e) => onChange({ ...value, fullName: { ...value.fullName, first: e.target.value } })}
          required
          fullWidth
        />
        <TextField
          label="Last name"
          value={value.fullName.last}
          onChange={(e) => onChange({ ...value, fullName: { ...value.fullName, last: e.target.value } })}
          required
          fullWidth
        />
      </Stack>
      <TextField
        label="SSN (9 digits)"
        value={value.ssn ?? ""}
        onChange={(e) => onChange({ ...value, ssn: e.target.value })}
        required
        fullWidth
      />
      <TextField
        label="Date of birth (YYYY-MM-DD)"
        value={value.dateOfBirth}
        onChange={(e) => onChange({ ...value, dateOfBirth: e.target.value })}
        required
        fullWidth
      />
      <TextField
        label="Email"
        type="email"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        required
        fullWidth
      />
      <TextField
        label="Phone number"
        value={value.phone.number}
        onChange={(e) => onChange({ ...value, phone: { ...value.phone, number: e.target.value } })}
        required
        fullWidth
      />
      <TextField
        label="Street"
        value={value.address.street}
        onChange={(e) => onChange({ ...value, address: { ...value.address, street: e.target.value } })}
        required
        fullWidth
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="City"
          value={value.address.city}
          onChange={(e) => onChange({ ...value, address: { ...value.address, city: e.target.value } })}
          required
          fullWidth
        />
        <TextField
          label="State"
          value={value.address.state}
          onChange={(e) => onChange({ ...value, address: { ...value.address, state: e.target.value } })}
          required
          sx={{ maxWidth: 120 }}
        />
        <TextField
          label="Postal code"
          value={value.address.postalCode}
          onChange={(e) =>
            onChange({ ...value, address: { ...value.address, postalCode: e.target.value } })
          }
          required
          sx={{ maxWidth: 160 }}
        />
      </Stack>
    </Stack>
  );
}

function BusinessFields({
  value,
  onChange,
}: {
  value: BusinessApplicationInput;
  onChange: (value: BusinessApplicationInput) => void;
}): React.ReactElement {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        Business details
      </Typography>
      <TextField
        label="Business name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        required
        fullWidth
      />
      <TextField
        label="EIN (9 digits)"
        value={value.ein}
        onChange={(e) => onChange({ ...value, ein: e.target.value })}
        required
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel id="business-vertical-label">Business vertical</InputLabel>
        <Select
          labelId="business-vertical-label"
          label="Business vertical"
          value={value.businessVertical}
          onChange={(e) =>
            onChange({
              ...value,
              businessVertical: e.target.value as BusinessApplicationInput["businessVertical"],
            })
          }
          required
        >
          {BUSINESS_VERTICALS.map((vertical) => (
            <MenuItem key={vertical} value={vertical}>
              {vertical}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Street"
        value={value.address.street}
        onChange={(e) => onChange({ ...value, address: { ...value.address, street: e.target.value } })}
        required
        fullWidth
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="City"
          value={value.address.city}
          onChange={(e) => onChange({ ...value, address: { ...value.address, city: e.target.value } })}
          required
          fullWidth
        />
        <TextField
          label="State"
          value={value.address.state}
          onChange={(e) => onChange({ ...value, address: { ...value.address, state: e.target.value } })}
          required
          sx={{ maxWidth: 120 }}
        />
        <TextField
          label="Postal code"
          value={value.address.postalCode}
          onChange={(e) =>
            onChange({ ...value, address: { ...value.address, postalCode: e.target.value } })
          }
          required
          sx={{ maxWidth: 160 }}
        />
      </Stack>
      <TextField
        label="Phone number"
        value={value.phone.number}
        onChange={(e) => onChange({ ...value, phone: { ...value.phone, number: e.target.value } })}
        required
        fullWidth
      />

      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
        Officer (CEO)
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Officer first name"
          value={value.officer.fullName.first}
          onChange={(e) =>
            onChange({
              ...value,
              officer: { ...value.officer, fullName: { ...value.officer.fullName, first: e.target.value } },
            })
          }
          required
          fullWidth
        />
        <TextField
          label="Officer last name"
          value={value.officer.fullName.last}
          onChange={(e) =>
            onChange({
              ...value,
              officer: { ...value.officer, fullName: { ...value.officer.fullName, last: e.target.value } },
            })
          }
          required
          fullWidth
        />
      </Stack>
      <TextField
        label="Officer SSN (9 digits)"
        value={value.officer.ssn ?? ""}
        onChange={(e) => onChange({ ...value, officer: { ...value.officer, ssn: e.target.value } })}
        required
        fullWidth
      />
      <TextField
        label="Officer date of birth (YYYY-MM-DD)"
        value={value.officer.dateOfBirth}
        onChange={(e) => onChange({ ...value, officer: { ...value.officer, dateOfBirth: e.target.value } })}
        required
        fullWidth
      />
      <TextField
        label="Officer email"
        type="email"
        value={value.officer.email}
        onChange={(e) => onChange({ ...value, officer: { ...value.officer, email: e.target.value } })}
        required
        fullWidth
      />
      <TextField
        label="Contact email"
        type="email"
        value={value.contact.email}
        onChange={(e) => onChange({ ...value, contact: { ...value.contact, email: e.target.value } })}
        required
        fullWidth
      />
    </Stack>
  );
}
