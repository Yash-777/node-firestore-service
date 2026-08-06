import { readEnv, firestore as commonFirestore } from "@node-firestore-service/common";

/**
 * Resolved configuration for the GraphQL web module. Every value here is
 * environment-driven so the same code can point at different Firestore
 * databases/collections (dev, staging, another region) purely via env vars,
 * with no code changes.
 *
 * @typedef {object} GraphqlEnv
 * @property {string} profile - `NODE_ENV`, e.g. "development" | "production".
 * @property {number} port - HTTP port to listen on.
 * @property {string} graphqlPath - Mount path for the GraphQL endpoint.
 * @property {boolean} graphiqlEnabled - Whether Apollo introspection is on.
 * @property {string[]} corsAllowedOrigins - Allowed CORS origins.
 * @property {object} firestore
 * @property {string} firestore.databaseId - Dynamic Firestore database id.
 * @property {string[]} firestore.collectionPath - Dynamic collection path segments.
 */

/** @type {GraphqlEnv} */
export const env = {
  profile: readEnv("NODE_ENV", { default: "development" }),
  port: Number(readEnv("PORT", { default: "4000" })),
  graphqlPath: readEnv("GRAPHQL_PATH", { default: "/graphql" }),
  graphiqlEnabled: readEnv("GRAPHIQL_ENABLED", { default: "true" }) === "true",
  corsAllowedOrigins: readEnv("CORS_ALLOWED_ORIGINS", { default: "*" })
    .split(",")
    .map((origin) => origin.trim()),
  firestore: {
    databaseId: commonFirestore.databaseId,
    collectionPath: commonFirestore.countryCollectionPath,
    collectionMasterPath: commonFirestore.countryMasterCollectionPath,
    dealerCollectionPath: commonFirestore.dealerCollectionPath,
  },
};
