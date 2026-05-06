import pkg from "hnswlib-node";
const { HierarchicalNSW } = pkg;
import { readFile } from "fs/promises";
import { writeFileSync } from "node:fs";

const raw = await readFile("./src/files/references.json", "utf-8");
const data = JSON.parse(raw);
const maxElements = 500000;
const M = 16;
const efConstruction = 500;

export const index = new HierarchicalNSW("l2", 14);
index.initIndex(maxElements, M, efConstruction);
const labelsBuffer = Buffer.alloc(maxElements); // Cria o espaço exato

for (let i = 0; i < maxElements; i++) {
  index.addPoint(data[i].vector, i);
  labelsBuffer[i] = data[i].label === "fraud" ? 1 : 0; // Preenche no mesmo loop
}

index.writeIndexSync("./src/files/hnsw_index.dat");
writeFileSync("./src/files/labels.bin", labelsBuffer);
