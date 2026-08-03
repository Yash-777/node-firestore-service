import { readEnv } from "@node-firestore-service/common";

/**
 * Resolved configuration for the country import script. Mirrors the
 * webmodule/graphql env shape for the Firestore target, so both modules
 * can be pointed at the same (or different) database/collection purely
 * through environment variables.
 *
 * @typedef {object} ImportEnv
 * @property {object} firestore
 * @property {string} firestore.databaseId - Dynamic Firestore database id.
 * @property {string[]} firestore.collectionPath - Dynamic collection path segments.
 */

/** @type {ImportEnv} */
export const env = {
  firestore: {
    databaseId: readEnv("FIRESTORE_DATABASE_ID", { default: "(default)" }),
    collectionPath: readEnv("FIRESTORE_COUNTRY_COLLECTION_PATH", {
      default: "master_data/countries/items",
    }).split("/"),
  },
};
