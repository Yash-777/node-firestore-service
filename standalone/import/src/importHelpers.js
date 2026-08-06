import fs from "fs-extra";
import path from "path";
import JSON5 from "json5";
import { fileURLToPath } from "url";
import { getDb, resolveCollection } from "@node-firestore-service/common";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Path to the shared reference-data folder, common to every module. */
const COMMON_DATA_DIR = path.join(__dirname, "..", "..", "..", "common", "src", "data");

/**
 * Loads and parses a JSON file from the shared `common/src/data` folder,
 * so reference data lives in exactly one place instead of being copied
 * into each module.
 *
 * @param {string} fileName - e.g. "AllCountries.json".
 * @returns {Promise<object>} Parsed JSON contents.
 */
export async function loadCommonJsonFile_RawDataWithoutComments(fileName) {
  const filePath = path.join(COMMON_DATA_DIR, fileName);
  return fs.readJson(filePath);
}

/**
 * JSON5 is the perfect library to support features like trailing commas, single-quoted strings, or unquoted keys alongside comments.
 * Loads and parses a JSON file from the shared `common/src/data` folder.
 *
 * @param {string} fileName - e.g. "AllCountries.json".
 * @returns {Promise<object>} Parsed JSON contents.
 */
export async function loadCommonJsonFile(fileName) {
  const filePath = path.join(COMMON_DATA_DIR, fileName);

  // 1. Read the file as raw text
  const rawText = await fs.readFile(filePath, 'utf8');

  // 2. Parse using JSON5 instead of standard JSON
  return JSON5.parse(rawText);
}

/**
 * Resolves the Firestore database and target collection reference using
 * dynamic configuration, instead of a hardcoded database/collection path.
 *
 * @param {{ databaseId: string, collectionPath: string[] }} firestoreConfig
 * @returns {Promise<{
 *   db: import("firebase-admin/firestore").Firestore,
 *   collectionRef: import("firebase-admin/firestore").CollectionReference
 * }>}
 */
export async function resolveCountriesCollection(firestoreConfig) {
  const db = await getDb({ databaseId: firestoreConfig.databaseId });
  const collectionRef = resolveCollection(db, firestoreConfig.collectionPath);
  return { db, collectionRef };
}

// CRUD primitives (clearCollection, fetchAllCollection, createCollection,
// fetchAndUpdate) now live in @node-firestore-service/common so both this
// script and the GraphQL web module share one implementation.
export { clearCollection, fetchAllCollection, createCollection, fetchAndUpdate } from "@node-firestore-service/common";
