import Fastify from "fastify";
import { mainRoutes } from "./routes.js";
import { initializeVectorStore } from "./utils/searchByVector.js";

const app = Fastify({
  logger: false,
});

const start = async () => {
  try {
    app.register(mainRoutes);
    initializeVectorStore();
    await app.listen({ host: "0.0.0.0", port: 3000 });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

start();
