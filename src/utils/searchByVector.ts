import { createClient } from "redis";

const INDEX_NAME = "idx:references"; // Adicionado para corresponder ao initializeStore.ts
const client = createClient({ url: process.env.REDIS_URL });
client.connect();

export const searchItemsByVector = async (
  normalizeVector: Float32Array, // Array de 14 posições
  KNN: number,
) => {
  // Converte o array para buffer binário (Float32) que o Redis exige
  const floatBuffer = Buffer.from(normalizeVector);

  // Busca KNN no Redis
  const results = await client.ft.search(
    INDEX_NAME,
    `*=>[KNN ${KNN} @vector $BLOB]`,
    {
      PARAMS: { BLOB: floatBuffer },
      SORTBY: "__vector_score",
      DIALECT: 2,
      RETURN: ["label"],
    },
  );

  // Conta as fraudes nos vizinhos
  let fraudCount = 0;
  (results as any).documents?.forEach((doc: any) => {
    if (doc.value?.label === "fraud") fraudCount++;
  });

  return fraudCount;
};
