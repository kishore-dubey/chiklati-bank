"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ApplicationResponse,
  BusinessApplicationInput,
  IndividualApplicationInput,
} from "@chiklati/shared";

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
    <div>
      <div role="radiogroup" aria-label="Application type">
        <label>
          <input
            type="radio"
            checked={kind === "individual"}
            onChange={() => setKind("individual")}
          />{" "}
          Individual
        </label>{" "}
        <label>
          <input type="radio" checked={kind === "business"} onChange={() => setKind("business")} /> Business
        </label>
      </div>

      <div>
        <span>Fill sandbox data: </span>
        <button type="button" onClick={() => fillSandboxData("approved")}>
          Approved
        </button>{" "}
        <button type="button" onClick={() => fillSandboxData("denied")}>
          Denied
        </button>{" "}
        <button type="button" onClick={() => fillSandboxData("pendingReview")}>
          Pending Review
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {kind === "individual" ? (
          <IndividualFields value={individual} onChange={setIndividual} />
        ) : (
          <BusinessFields value={business} onChange={setBusiness} />
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit application"}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}

      {application ? (
        <section>
          <h2>Application status</h2>
          <p>
            <strong>{application.applicantName}</strong> ({application.type}) &mdash;{" "}
            <strong>{application.status}</strong>
            {isPolling ? " (checking for updates...)" : ""}
          </p>
          <p>Unit application ID: {application.unitApplicationId}</p>
        </section>
      ) : null}
    </div>
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
    <fieldset>
      <legend>Individual details</legend>
      <input
        placeholder="First name"
        value={value.fullName.first}
        onChange={(e) => onChange({ ...value, fullName: { ...value.fullName, first: e.target.value } })}
        required
      />
      <input
        placeholder="Last name"
        value={value.fullName.last}
        onChange={(e) => onChange({ ...value, fullName: { ...value.fullName, last: e.target.value } })}
        required
      />
      <input
        placeholder="SSN (9 digits)"
        value={value.ssn ?? ""}
        onChange={(e) => onChange({ ...value, ssn: e.target.value })}
        required
      />
      <input
        placeholder="Date of birth (YYYY-MM-DD)"
        value={value.dateOfBirth}
        onChange={(e) => onChange({ ...value, dateOfBirth: e.target.value })}
        required
      />
      <input
        placeholder="Email"
        type="email"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        required
      />
      <input
        placeholder="Phone number"
        value={value.phone.number}
        onChange={(e) => onChange({ ...value, phone: { ...value.phone, number: e.target.value } })}
        required
      />
      <input
        placeholder="Street"
        value={value.address.street}
        onChange={(e) => onChange({ ...value, address: { ...value.address, street: e.target.value } })}
        required
      />
      <input
        placeholder="City"
        value={value.address.city}
        onChange={(e) => onChange({ ...value, address: { ...value.address, city: e.target.value } })}
        required
      />
      <input
        placeholder="State (2-letter)"
        value={value.address.state}
        onChange={(e) => onChange({ ...value, address: { ...value.address, state: e.target.value } })}
        required
      />
      <input
        placeholder="Postal code"
        value={value.address.postalCode}
        onChange={(e) => onChange({ ...value, address: { ...value.address, postalCode: e.target.value } })}
        required
      />
    </fieldset>
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
    <fieldset>
      <legend>Business details</legend>
      <input
        placeholder="Business name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        required
      />
      <input
        placeholder="Street"
        value={value.address.street}
        onChange={(e) => onChange({ ...value, address: { ...value.address, street: e.target.value } })}
        required
      />
      <input
        placeholder="City"
        value={value.address.city}
        onChange={(e) => onChange({ ...value, address: { ...value.address, city: e.target.value } })}
        required
      />
      <input
        placeholder="State (2-letter)"
        value={value.address.state}
        onChange={(e) => onChange({ ...value, address: { ...value.address, state: e.target.value } })}
        required
      />
      <input
        placeholder="Postal code"
        value={value.address.postalCode}
        onChange={(e) => onChange({ ...value, address: { ...value.address, postalCode: e.target.value } })}
        required
      />
      <input
        placeholder="Phone number"
        value={value.phone.number}
        onChange={(e) => onChange({ ...value, phone: { ...value.phone, number: e.target.value } })}
        required
      />

      <legend>Officer (CEO)</legend>
      <input
        placeholder="Officer first name"
        value={value.officer.fullName.first}
        onChange={(e) =>
          onChange({
            ...value,
            officer: { ...value.officer, fullName: { ...value.officer.fullName, first: e.target.value } },
          })
        }
        required
      />
      <input
        placeholder="Officer last name"
        value={value.officer.fullName.last}
        onChange={(e) =>
          onChange({
            ...value,
            officer: { ...value.officer, fullName: { ...value.officer.fullName, last: e.target.value } },
          })
        }
        required
      />
      <input
        placeholder="Officer SSN (9 digits)"
        value={value.officer.ssn ?? ""}
        onChange={(e) => onChange({ ...value, officer: { ...value.officer, ssn: e.target.value } })}
        required
      />
      <input
        placeholder="Officer date of birth (YYYY-MM-DD)"
        value={value.officer.dateOfBirth}
        onChange={(e) => onChange({ ...value, officer: { ...value.officer, dateOfBirth: e.target.value } })}
        required
      />
      <input
        placeholder="Officer email"
        type="email"
        value={value.officer.email}
        onChange={(e) => onChange({ ...value, officer: { ...value.officer, email: e.target.value } })}
        required
      />
      <input
        placeholder="Contact email"
        type="email"
        value={value.contact.email}
        onChange={(e) => onChange({ ...value, contact: { ...value.contact, email: e.target.value } })}
        required
      />
    </fieldset>
  );
}
