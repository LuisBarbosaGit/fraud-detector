import type { FastifyReply, FastifyRequest } from "fastify";
import { fraudDetectionSchema } from "../schema.js";
import { calculateFraudScore } from "../services/calculateFraudScore.js";

export const fraudScoreController = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const parsedBody = fraudDetectionSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return reply.status(400).send({
      message: "Invalid request body",
      issues: parsedBody.error.issues,
    });
  }

  const { approved, score } = await calculateFraudScore(parsedBody.data);

  return reply.send({
    approved,
    fraud_score: score,
  });
};
