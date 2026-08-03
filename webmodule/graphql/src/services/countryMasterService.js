import { getDb, resolveCollection, docToObject, fetchAllCollection, fetchAndUpdate } from "@node-firestore-service/common";
import { env } from "../config/env.js";

/**
 * Resolves the Firestore collection reference for country master data,
 * using the dynamic database id / collection path from module config
 * rather than a hardcoded path.
 *
 * @returns {Promise<import("firebase-admin/firestore").CollectionReference>}
 */
async function getCountriesCollection() {
  const db = await getDb({ databaseId: env.firestore.databaseId });
  return resolveCollection(db, env.firestore.collectionPath);
}

/**
 * Fetches every country document from the configured collection.
 *
 * @returns {Promise<object[]>} Array of country records.
 */
export async function getAllCountries() {
  const collectionRef = await getCountriesCollection();
  return fetchAllCollection(collectionRef);
}

/**
 * Fetches every country that has a locale entry for the given language code.
 *
 * @param {string} languageCode - e.g. "en", "fr", "de".
 * @returns {Promise<object[]>} Array of matching country records.
 */
export async function getAllCountriesByLocale(languageCode) {
  const allCountries = await getAllCountries();
  return allCountries.filter((country) => country.locales && country.locales[languageCode]);
}

/**
 * Fetches a single country (with its `locales` map) by country code.
 *
 * @param {string} countryCode - e.g. "IN", "US".
 * @returns {Promise<object|null>} The country record, or null if not found.
 */
export async function getCountryLocalesByCountryCode(countryCode) {
  const collectionRef = await getCountriesCollection();
  const snapshot = await collectionRef.doc(countryCode).get();
  return docToObject(snapshot);
}

/**
 * Merges partial updates into an existing country document.
 *
 * @param {string} countryCode - e.g. "IN", "US".
 * @param {object} updates - Partial fields to merge into the document.
 * @returns {Promise<object|null>} The updated country record.
 */
export async function updateCountry(countryCode, updates) {
  const collectionRef = await getCountriesCollection();
  return fetchAndUpdate(collectionRef, countryCode, updates);
}
