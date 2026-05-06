import type { FastifyInstance, FastifyReply } from "fastify";

import { fraudResponseSchema } from "./schema.js";
import { fraudScoreController } from "./controllers/fraudScoreController.js";

export const mainRoutes = (app: FastifyInstance) => {
  app.get("/ready", async (_, reply: FastifyReply) => {
    return reply.code(200).send();
  });

  app.post(
    "/fraud-score",
    { schema: fraudResponseSchema },
    fraudScoreController,
  );
};
