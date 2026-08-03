import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { createLogger } from "@node-firestore-service/common";
import { env } from "./config/env.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";

const logger = createLogger("graphql");

/**
 * Boots the Express + Apollo Server GraphQL service. Exported (rather than
 * only invoked at the bottom of this file) so it can be imported and
 * started from a test harness without going through the CLI entrypoint.
 *
 * @returns {Promise<import("express").Express>} The running Express app.
 */
export async function startServer() {
  const app = express();

  app.get("/health-check", (_req, res) => {
    res.status(200).json({ status: "UP" });
  });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: env.graphiqlEnabled,
  });
  await apolloServer.start();

  app.use(
    env.graphqlPath,
    cors({ origin: env.corsAllowedOrigins }),
    bodyParser.json(),
    expressMiddleware(apolloServer)
  );

  app.listen(env.port, () => {
    logger.info(`Firestore GraphQL service (profile: ${env.profile}) listening on port ${env.port}`);
    logger.info(`GraphQL endpoint: http://localhost:${env.port}${env.graphqlPath}`);
  });

  return app;
}

startServer().catch((error) => {
  logger.error("Failed to start GraphQL service:", error);
  process.exit(1);
});
