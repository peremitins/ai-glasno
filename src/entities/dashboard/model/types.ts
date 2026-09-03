import { z } from "zod";

import { interviewSessionSchema } from "@/entities/session/model/types";

export const dashboardOverviewSchema = z.object({
  activeSessions: z.number().int().nonnegative(),
  completedSessions: z.number().int().nonnegative(),
  nextSession: z.object({
    topic: z.string(),
  }),
  recentSessions: z.array(interviewSessionSchema),
});

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
