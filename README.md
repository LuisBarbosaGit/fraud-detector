# Rinha Backend 2026 — API com busca vetorial

Backend em **Node.js**, **Fastify** e **TypeScript**, com build para **ESM** em `build/` via **tsup**. Inclui índice **HNSW** (`hnswlib-node`) para consulta por similaridade e **Docker Compose** com duas réplicas da API atrás de **nginx** na porta **9999**.

## Stack

| Peça              | Uso                                            |
| ----------------- | ---------------------------------------------- |
| Fastify           | Servidor HTTP                                  |
| TypeScript + tsup | Código-fonte em `src/`, saída em `build/`      |
| tsx               | Desenvolvimento com hot reload (`npm run dev`) |
| zod               | Validação do corpo em `POST /fraud-score`      |
| hnswlib-node      | Índice vetorial e busca k-NN                   |

## Estrutura principal

- `src/server.ts` — bootstrap Fastify
- `src/routes.ts` — rotas HTTP
- `src/schema.ts` — schema Zod da requisição de fraude
- `src/utils/convertToVector.ts` — normalização numérica para o vetor de 14 dimensões
- `src/utils/searchByVector.ts` — carrega índice e `labels.json` de `./files` em runtime
- `src/scripts/script.ts` — gera `hnsw_index.dat` e `labels.json` a partir de `src/files/references.json`
- `nginx.conf` — load balancer (upstream `api1:3000` e `api2:3000`, escuta **9999**)
- `docker-compose.yml` — `api1`, `api2` e `nginx`, com limites de CPU/memória por serviço

## Scripts (`package.json`)

| Comando          | Descrição                                                                            |
| ---------------- | ------------------------------------------------------------------------------------ |
| `npm run build`  | Compila `src/server.ts` e `src/scripts/script.ts` para `build/` (ESM, `--clean`)     |
| `npm run start`  | Sobe a API com `node build/server.js` (rode `build` antes se `build/` estiver vazio) |
| `npm run dev`    | Desenvolvimento: `tsx watch src/server.ts`                                           |
| `npm run script` | Executa o build do índice: `node build/scripts/script.js`                            |

Na imagem Docker, o **Dockerfile** roda `npm run build`, em seguida `npm run script`, copia `src/files` (incluindo artefatos gerados) para `./files` no container e inicia com `node build/server.js`.

## API

### `GET /health`

Resposta JSON com status do serviço.

### `POST /fraud-score`

Corpo JSON validado por `fraudDetectionSchema` em `src/schema.ts` (campos como `id`, `transaction`, `customer`, `merchant`, `terminal`, `last_transaction`). Em caso de payload inválido, a rota lança erro.

Resposta de exemplo (forma):

- `approved` — booleano
- `fraud_score` — proporção de vizinhos rotulados como fraude entre os 5 mais próximos

A API escuta na porta **3000** dentro do container; o **nginx** na porta **9999** encaminha para as duas instâncias.

## Docker

Subir tudo (build da imagem + nginx):

```bash
docker compose up --build
```

Testes rápidos:

```bash
curl http://localhost:9999/health
```

Para `POST /fraud-score`, envie um JSON que satisfaça o schema em `src/schema.ts` (veja os tipos e campos obrigatórios nesse arquivo).

## Desenvolvimento local

Requer Node/npm instalados.

```bash
npm install
npm run build
npm run script   # gera índice e labels em src/files (caminhos usados pelo script)
npm run start    # ou: npm run dev
```

O script grava `hnsw_index.dat` e `labels.json` em `src/files/`. A API em runtime lê `./files/` (na raiz do projeto). No **Docker**, o Dockerfile copia `src/files` para `./files` dentro da imagem, então tudo fica alinhado. Para **`npm run start` na máquina**, crie a pasta `files/` na raiz e copie para lá os artefatos gerados (ou os caminhos em `searchByVector.ts` precisam apontar para `src/files/`).

## Observação sobre portas

- **Cliente → nginx:** `localhost:9999`
- **nginx → APIs:** `api1:3000` e `api2:3000` (definido em `nginx.conf`)

## Benchmarks e testes

Velocidade das funcões utilizadas na rota /fraud-score
convertToVector: 0.00 ms
searchItemsByVector: 0.01 ms
