import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getServiceAccount } from "./serviceAccount.js";

/** @type {Map<string, admin.app.App>} Cache of initialized Firebase Admin apps, keyed by app name. */
const appCache = new Map();

/**
 * Lazily initializes (and caches) a named Firebase Admin app instance.
 * Supporting a named app — rather than always using the implicit default —
 * allows a future module to connect to a second Firebase project without
 * clashing with the first `admin.initializeApp()` call.
 *
 * @param {string} [appName="[DEFAULT]"] - Firebase Admin app name.
 * @returns {Promise<admin.app.App>} The initialized app instance.
 */
export async function getFirebaseApp(appName = "[DEFAULT]") {
  if (appCache.has(appName)) return appCache.get(appName);

  const existing = admin.apps.find((a) => a && a.name === appName);
  if (existing) {
    appCache.set(appName, existing);
    return existing;
  }

  const serviceAccount = await getServiceAccount();
  const app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, appName);
  appCache.set(appName, app);
  return app;
}

/**
 * Resolves a Firestore database instance. Firebase projects can host
 * multiple **named** Firestore databases (not just the `(default)` one);
 * passing `databaseId` here means the actual database used is driven
 * entirely by configuration (env vars) instead of being hardcoded.
 *
 * @param {object} [options]
 * @param {string} [options.databaseId="(default)"] - Firestore database id.
 * @param {string} [options.appName="[DEFAULT]"] - Firebase Admin app name.
 * @returns {Promise<import("firebase-admin/firestore").Firestore>}
 */
export async function getDb({ databaseId = "(default)", appName = "[DEFAULT]" } = {}) {
  const app = await getFirebaseApp(appName);
  return databaseId && databaseId !== "(default)" ? getFirestore(app, databaseId) : getFirestore(app);
}

/**
 * Builds a Firestore `CollectionReference` from a dynamic array of path
 * segments (collection/doc/collection/...), instead of chaining hardcoded
 * `.collection(...).doc(...).collection(...)` calls. Firestore accepts a
 * single slash-delimited path, e.g. `db.collection("a/b/c")` is exactly
 * equivalent to `db.collection("a").doc("b").collection("c")`.
 *
 * @param {import("firebase-admin/firestore").Firestore} db - Firestore instance.
 * @param {string[]} pathSegments - e.g. `["master_data", "countries", "items"]` or `["master_data", "countries"]` or `["countries"]`
 * @returns {import("firebase-admin/firestore").CollectionReference}
 * @throws {Error} If `pathSegments` isn't a non-empty, odd-length array.
 */
export function resolveCollection(db, pathSegments) {
  if (!Array.isArray(pathSegments) || pathSegments.length === 0 || pathSegments.length % 2 === 0) {
    throw new Error(
      "pathSegments must be a non-empty array with an odd length: [collection, doc, collection, ...]"
    );
  }
  return db.collection(pathSegments.join("/"));
}
