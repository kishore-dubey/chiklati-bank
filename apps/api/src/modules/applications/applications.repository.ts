import { prisma, type Application, type ApplicationStatus, type ApplicationType } from "@chiklati/db";

export interface CreateApplicationRecordInput {
  unitApplicationId: string;
  userId: string;
  type: ApplicationType;
  status: ApplicationStatus;
  applicantName: string;
  applicantEmail: string;
}

export async function createApplicationRecord(input: CreateApplicationRecordInput): Promise<Application> {
  return prisma.application.create({
    data: {
      unitApplicationId: input.unitApplicationId,
      userId: input.userId,
      type: input.type,
      status: input.status,
      applicantSnapshot: { name: input.applicantName, email: input.applicantEmail },
    },
  });
}

export async function findApplicationById(id: string, userId: string): Promise<Application | null> {
  return prisma.application.findFirst({ where: { id, userId } });
}
