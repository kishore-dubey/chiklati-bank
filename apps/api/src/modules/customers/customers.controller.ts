import type { FastifyReply, FastifyRequest } from "fastify";
import type { Customer } from "@chiklati/db";
import type { CustomerResponse } from "@chiklati/shared";
import { findCustomersForUser } from "./customers.repository.js";

function toCustomerResponse(record: Customer): CustomerResponse {
  return {
    id: record.id,
    unitCustomerId: record.unitCustomerId,
    type: record.type,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getCustomers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.userId) {
    await reply.status(401).send({ error: "Unauthenticated" });
    return;
  }

  const customers = await findCustomersForUser(request.userId);
  await reply.status(200).send(customers.map(toCustomerResponse));
}
