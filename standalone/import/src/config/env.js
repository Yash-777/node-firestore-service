import { firestore as commonFirestore } from "@node-firestore-service/common";

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
    databaseId: commonFirestore.databaseId,
    collectionPath: commonFirestore.countryCollectionPath,
    dealerCollectionPath: commonFirestore.dealerCollectionPath,
  },
};
