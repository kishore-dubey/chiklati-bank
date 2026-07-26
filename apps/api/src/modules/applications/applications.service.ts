import { ApplicationStatus, ApplicationType, type Application } from "@chiklati/db";
import type { ApplicationResponse, CreateApplicationInput } from "@chiklati/shared";
import { createBusinessApplication, createIndividualApplication } from "../../lib/unit/applications.resource.js";
import type { UnitApplicationStatus } from "../../lib/unit/unit-client.types.js";
import {
  applicantDisplayEmail,
  applicantDisplayName,
  toUnitBusinessApplicationAttributes,
  toUnitIndividualApplicationAttributes,
} from "./applications.mapper.js";
import { createApplicationRecord, findApplicationById } from "./applications.repository.js";

function toLocalStatus(status: UnitApplicationStatus): ApplicationStatus {
  return ApplicationStatus[status as keyof typeof ApplicationStatus];
}

function toApplicationResponse(record: Application): ApplicationResponse {
  const snapshot = record.applicantSnapshot as { name: string; email: string };

  return {
    id: record.id,
    unitApplicationId: record.unitApplicationId,
    type: record.type,
    status: record.status,
    applicantName: snapshot.name,
    applicantEmail: snapshot.email,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function createApplication(
  userId: string,
  input: CreateApplicationInput,
  idempotencyKey: string,
): Promise<ApplicationResponse> {
  const unitDocument =
    input.type === "individual"
      ? await createIndividualApplication(toUnitIndividualApplicationAttributes(input, idempotencyKey))
      : await createBusinessApplication(toUnitBusinessApplicationAttributes(input, idempotencyKey));

  const record = await createApplicationRecord({
    unitApplicationId: unitDocument.data.id,
    userId,
    type: input.type === "individual" ? ApplicationType.Individual : ApplicationType.Business,
    status: toLocalStatus(unitDocument.data.attributes.status),
    applicantName: applicantDisplayName(input),
    applicantEmail: applicantDisplayEmail(input),
  });

  return toApplicationResponse(record);
}

export async function getApplicationById(
  id: string,
  userId: string,
): Promise<ApplicationResponse | null> {
  const record = await findApplicationById(id, userId);
  return record ? toApplicationResponse(record) : null;
}
