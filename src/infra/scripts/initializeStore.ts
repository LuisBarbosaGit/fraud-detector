// Troque SchemaFieldType por SchemaFieldTypes e adicione VectorAlgorithms
import { createClient } from "redis";
import { createReadStream } from "node:fs";
import make from "stream-json";
import streamArray from "stream-json/streamers/stream-array.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const INDEX_NAME = "idx:references";
const VECTOR_DIM = 14;
const MAX_ELEMENTS = 3000000;

async function initializeRedisStore() {
  const client = createClient({ url: REDIS_URL });
  await client.connect();

  const info = await client.ft.info(INDEX_NAME).catch(() => null);
  if (info) {
    console.log("Índice já existe no volume. Pulando alimentação...");
    process.exit(0);
  }

  console.log("Conectado ao Redis. Criando índice...");

  await client.ft.create(
    INDEX_NAME,
    {
      "$.vector": {
        type: "VECTOR",
        ALGORITHM: "HNSW",
        TYPE: "FLOAT32",
        DIM: VECTOR_DIM,
        DISTANCE_METRIC: "L2",
        INITIAL_CAP: MAX_ELEMENTS,
        M: 16,
        EF_CONSTRUCTION: 200,
      },
      "$.label": {
        type: "NUMERIC" as any,
        AS: "label",
      },
    },
    {
      ON: "JSON",
      PREFIX: "ref:",
    },
  );

  // 3. Stream do JSON para o Redis
  const stream = createReadStream("./src/infra/files/references.json")
    .pipe(make())
    .pipe(streamArray.asStream());

  let i = 0;
  let batch = client.multi();

  for await (const { value } of stream) {
    if (i >= MAX_ELEMENTS) break;

    // Salvando como JSON no Redis
    batch.json.set(`ref:${i}`, "$", {
      vector: value.vector,
      label: value.label === "fraud" ? 0 : 1,
    });

    i++;

    // Executa em lotes de 1000 para performance
    if (i % 1000 === 0) {
      await batch.exec();
      batch = client.multi();
      console.log(`Progresso: ${i} vetores inseridos...`);
    }
  }

  await batch.exec();
  console.log("Finalizado! Banco vetorial pronto no Redis.");
  await client.quit();
}

initializeRedisStore().catch(console.error);
