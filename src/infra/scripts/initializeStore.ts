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

  while (true) {
    try {
      await client.ping(); 
      break;
    } catch (err: any) {
      if (err.message.includes("LOADING")) {
        await new Promise(res => setTimeout(res, 1000));
        continue;
      }
      throw err;
    }
  }

  await client.flushAll();

  await client.ft.create(
    INDEX_NAME,
    {
      vector: {
        type: "VECTOR",
        ALGORITHM: "HNSW",
        TYPE: "FLOAT32",
        DIM: VECTOR_DIM,
        DISTANCE_METRIC: "L2",
        INITIAL_CAP: MAX_ELEMENTS,
        M: 16,
        EF_CONSTRUCTION: 400,
      },
      label: {
        type: "NUMERIC" as any,
        AS: "label",
      },
    },
    {
      ON: "HASH",
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

    const floatBuffer = Buffer.from(new Float32Array(value.vector).buffer);
    // Salvando como JSON no Redis
    batch.hSet(`ref:${i}`, {
      vector: floatBuffer,
      label: value.label === "fraud" ? "1" : "0",
    });

    i++;

    // Executa em lotes de 1000 para performance
    if (i % 10000 === 0) {
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
