import type { FraudDetectionPayload } from "../../schema.js";
import { maxNeighbors, minimalToAprove } from "../../constants/index.js";
import { convertToVector } from "../../utils/convertToVector.js";
import { searchItemsByVector } from "../../utils/searchByVector.js";

export const calculateFraudScore = async (data: FraudDetectionPayload) => {
  const dataToVector = convertToVector(data);

  // Busca os N vizinhos mais proximos para calcular o score de fraude.
  const fraudCount = await searchItemsByVector(dataToVector, maxNeighbors);
  const score = fraudCount / maxNeighbors;
  const isAproved = score < minimalToAprove;

  return { isAproved, score };
};
