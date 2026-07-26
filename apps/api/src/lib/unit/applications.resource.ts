import { unitRequest } from "./unit-client.js";
import type {
  UnitApplicationDocument,
  UnitBusinessApplicationRequestAttributes,
  UnitIndividualApplicationRequestAttributes,
} from "./unit-client.types.js";

export async function createIndividualApplication(
  attributes: UnitIndividualApplicationRequestAttributes,
): Promise<UnitApplicationDocument> {
  return unitRequest<UnitApplicationDocument>("POST", "/applications", {
    data: { type: "individualApplication", attributes },
  });
}

export async function createBusinessApplication(
  attributes: UnitBusinessApplicationRequestAttributes,
): Promise<UnitApplicationDocument> {
  return unitRequest<UnitApplicationDocument>("POST", "/applications", {
    data: { type: "businessApplication", attributes },
  });
}

export async function getApplication(unitApplicationId: string): Promise<UnitApplicationDocument> {
  return unitRequest<UnitApplicationDocument>("GET", `/applications/${unitApplicationId}`);
}
