import pkg from "hnswlib-node";
const { HierarchicalNSW } = pkg;
import { readFileSync } from "fs";

const index = new HierarchicalNSW("l2", 14);
const maxNeighbors = 5;
let labelsBuffer: Uint8Array;
const fixedArray = new Array(14);

export const initializeVectorStore = () => {
  index.readIndexSync("./files/hnsw_index.dat"); //Mude para ./src/files para local
  index.setEf(72);

  const buffer = readFileSync("./files/labels.bin");
  labelsBuffer = new Uint8Array(buffer);
};

export const searchItemsByVector = (normalizeVector: Float32Array): number => {
  for (let i = 0; i < 14; i++) {
    fixedArray[i] = normalizeVector[i];
  }
  const resultOfSearch = index.searchKnn(fixedArray, maxNeighbors);

  let cheatCount = 0;

  for (let i = 0; i < resultOfSearch.neighbors.length; i++) {
    // Acesso direto ao buffer por índice numérico
    cheatCount += labelsBuffer[resultOfSearch.neighbors[i]];
  }

  return cheatCount;
};
