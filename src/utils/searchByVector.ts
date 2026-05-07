import { createClient } from "redis";

const INDEX_NAME = "idx:references"; // Adicionado para corresponder ao initializeStore.ts
const client = createClient({ url: process.env.REDIS_URL });
client.connect();

export const searchItemsByVector = async (
  normalizeVector: Float32Array, // Array de 14 posições
  KNN: number,
) => {
  // Converte o array para buffer binário (Float32) que o Redis exige
  const floatBuffer = Buffer.from(normalizeVector.buffer);

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
  const items = (results as any)?.documents ?? [];

  for (let i = 0; i < items.length; i++) {
    fraudCount += Number(items[i].value?.label || 0);
  }

  console.log(fraudCount);

  return fraudCount;
};
