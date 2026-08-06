import { collectionToList, docToObject } from "./firestoreHelper.js";

export async function resolveCollectionRef(databaseId, collectionPath) {
  const db = await getDb({ databaseId: databaseId });
  const collectionRef = resolveCollection(db, collectionPath);
  return { db, collectionRef };
}

/**
 * Deletes every document under a collection reference (recursive delete).
 *
 * @param {import("firebase-admin/firestore").Firestore} db - Firestore instance.
 * @param {import("firebase-admin/firestore").CollectionReference} collectionRef - Collection to clear.
 * @returns {Promise<void>}
 */
export async function clearCollection(db, collectionRef) {
  await db.recursiveDelete(collectionRef);
}

/**
 * Fetches every document in a collection as plain objects.
 *
 * @param {import("firebase-admin/firestore").CollectionReference} collectionRef
 * @returns {Promise<object[]>} Array of documents, each with `id` merged in.
 */
export async function fetchAllCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  return collectionToList(snapshot);
}

/**
 * Creates (or overwrites) a single document with the given data.
 *
 * @param {import("firebase-admin/firestore").CollectionReference} collectionRef
 * @param {string} docId - Document id.
 * @param {object} data - Full document payload.
 * @returns {Promise<object>} The created document, with `id` merged in.
 */
export async function createCollection(collectionRef, docId, data) {
  const docRef = collectionRef.doc(docId);
  await docRef.set(data);
  const snapshot = await docRef.get();
  return docToObject(snapshot);
}

/**
 * Fetches a document, merges the given updates into it, and returns the
 * updated document. Uses `{ merge: true }` so unspecified fields are left
 * untouched rather than being wiped out.
 *
 * @param {import("firebase-admin/firestore").CollectionReference} collectionRef
 * @param {string} docId - Document id.
 * @param {object} updates - Partial fields to merge into the document.
 * @returns {Promise<object|null>} The updated document, or null if it doesn't exist after the merge.
 */
export async function fetchAndUpdate(collectionRef, docId, updates) {
  const docRef = collectionRef.doc(docId);
  await docRef.set(updates, { merge: true });
  const snapshot = await docRef.get();
  return docToObject(snapshot);
}
