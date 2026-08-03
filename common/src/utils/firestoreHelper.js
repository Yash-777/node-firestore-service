/**
 * Converts a single Firestore `DocumentSnapshot` into a plain object with
 * its `id` merged in, or `null` if the document doesn't exist.
 *
 * @param {import("firebase-admin/firestore").DocumentSnapshot} snapshot
 * @returns {object|null}
 */
export function docToObject(snapshot) {
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

/**
 * Converts a Firestore `QuerySnapshot` into an array of plain objects,
 * each with its `id` merged in.
 *
 * @param {import("firebase-admin/firestore").QuerySnapshot} querySnapshot
 * @returns {object[]}
 */
export function collectionToList(querySnapshot) {
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
