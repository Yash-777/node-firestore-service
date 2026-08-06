import {createLogger, resolveCollectionRef} from "@node-firestore-service/common";
import { env } from "./config/env.js";
import {
  loadCommonJsonFile,
  clearCollection,
  createCollection,
  fetchAllCollection,
  fetchAndUpdate,
} from "./importHelpers.js";

const logger = createLogger("import");

/**
 * Loads the shared `AllCountries.json` reference data and resolves the
 * Firestore db/collection to operate on (both dynamic, via env config).
 *
 * @returns {Promise<{
 *   countries: Record<string, object>,
 *   db: import("firebase-admin/firestore").Firestore,
 *   collectionRef: import("firebase-admin/firestore").CollectionReference
 * }>}
 */
async function loadCountriesAndCollection() {
  const countriesData = await loadCommonJsonFile("AllCountries.json");
  const { db, collectionRef } = await resolveCollectionRef(env.firestore.databaseId, env.firestore.collectionPath);
  return { countries: countriesData.countryListItems ?? {}, db, collectionRef };
}

/**
 * CREATE — inserts every country from `AllCountries.json` as a new
 * Firestore document (one `createCollection` call per country).
 *
 * @returns {Promise<void>}
 */
async function createCountries() {
  const { countries, collectionRef } = await loadCountriesAndCollection();
  const codes = Object.keys(countries);
  logger.info(`Creating ${codes.length} countries in ${env.firestore.collectionPath.join("/")}...`);

  for (const countryCode of codes) {
    const item = countries[countryCode];

    if (!item || !item.countryCode || !item.countryName) {
      logger.warn("Skipping invalid country item:", item);
      continue;
    }

    await createCollection(collectionRef, countryCode, item);
    logger.info(`Created ${countryCode} (${item.countryName})`);
  }

  logger.info("Create completed successfully.");
}

/**
 * READ / FETCH — reads back every country document currently stored in
 * Firestore and prints a summary table.
 *
 * @returns {Promise<void>}
 */
async function fetchCountries() {
  const { collectionRef } = await loadCountriesAndCollection();
  const results = await fetchAllCollection(collectionRef);

  const codes = results.map((doc) => doc.id);
  //logger.info('Full Collection as JSON:', JSON.stringify(results, null, 2));
  logger.info(`Fetched ${results.length} countries from ${env.firestore.collectionPath.join("/")}:`);
  logger.info("Country codes:", codes.join(", "));
  logger.info("Displaying summary table (id, countryName, region, currencyCode, dialingCode):");
  console.table(
    results.map(({ id, countryName, region, currencyCode, dialingCode }) => ({
      id,
      countryName,
      region,
      currencyCode,
      dialingCode,
    }))
  );
}

/**
 * UPDATE — merges the `region` / `isActive` fields from `AllCountries.json`
 * into each existing Firestore document (one `fetchAndUpdate` call per
 * country). Only the given fields are touched; everything else already
 * stored on the document is left as-is.
 *
 * @returns {Promise<void>}
 */
async function updateCountries() {
  const { countries, collectionRef } = await loadCountriesAndCollection();
  const codes = Object.keys(countries);
  logger.info(`Updating ${codes.length} countries in ${env.firestore.collectionPath.join("/")}...`);

  for (const countryCode of codes) {
    const item = countries[countryCode];
    const updates = { region: item.region, isActive: item.isActive };

    const updated = await fetchAndUpdate(collectionRef, countryCode, updates);
    logger.info(`Updated ${countryCode}:`, updated ? { region: updated.region } : "document not found");
  }

  logger.info("Update completed successfully.");
}

/**
 * DELETE / CLEAR — recursively removes every document under the target
 * collection.
 *
 * @returns {Promise<void>}
 */
async function clearCountries() {
  logger.info(`Clearing ${env.firestore.collectionPath.join("/")}...`);
  //const { db, collectionRef } = await loadCountriesAndCollection();
  const { db, collectionRef } = await resolveCollectionRef(env.firestore.databaseId, env.firestore.collectionPath);

  await clearCollection(db, collectionRef);
  logger.info("Clear completed successfully.");
}

/** @type {Record<string, () => Promise<void>>} Command name -> handler. */
const COMMANDS = {
  create: createCountries,
  fetch: fetchCountries,
  update: updateCountries,
  clear: clearCountries,
  read: () => readCollection(env.firestore.databaseId, env.firestore.collectionPath[env.firestore.collectionPath.length - 1]),
};

const command = (process.argv[2] || "").toLowerCase();
const run = COMMANDS[command];

if (!run) {
  console.error(`\nUnknown or missing command: "${command}"`);
  console.error("Usage: npm start <create|fetch|update|clear>\n");
  process.exit(1);
}

run().catch((error) => {
  logger.error(`"${command}" command failed:`, error);
  process.exit(1);
});

// ----------------------------------------------
//const { getFirestore } = require('firebase-admin/firestore'); // ReferenceError: require is not defined in ES module scope, you can use import instead
import { getFirestore } from "firebase-admin/firestore";
/**
 * Reads all documents from a specified collection inside a given database.
 *
 * @param {string} dbIdOrName - The database ID (e.g., '(default)', 'org-database-id')
 * @param {string} collectionName - The name of the collection to read
 * @returns {Promise<Array<object>>} An array of documents containing IDs and data
 */
async function readCollection(dbIdOrName, collectionName) {
  try {
    // Check if we need the default database or a named database
    const isDefault = !dbIdOrName || dbIdOrName === 'default' || dbIdOrName === '(default)';

    const { db, collectionRef } = await resolveCollectionRef(env.firestore.databaseId, env.firestore.collectionPath);
    // getFirestore() with no args targets '(default)', otherwise targets the named DB
    //const db = isDefault ? getFirestore() : getFirestore(dbIdOrName);

    // Fetch the collection
    //const snapshot = await db.collection(collectionName).get();
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log(`No documents found in ${collectionName} for database: ${dbIdOrName}`);
      return [];
    }

    // Map the documents to a clean array of objects
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`Fetched ${results.length} documents from ${collectionName} in database: ${dbIdOrName}`);
    //console.log(`Full collection as JSON:`, JSON.stringify(results, null, 2));
    return results;
  } catch (error) {
    console.error(`Error reading collection "${collectionName}" from database "${dbIdOrName}":`, error);
    throw error;
  }
}