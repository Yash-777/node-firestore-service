import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Attempts to parse a string as JSON, falling back to base64-decoding it
 * first (useful when a service account JSON is stored as a single-line
 * base64 secret in CI/CD or a secrets manager).
 *
 * @param {string|undefined} raw
 * @returns {object|null} Parsed service account object, or null if unparsable.
 */
function tryParseServiceAccount(raw) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

/**
 * Resolves a Firebase Admin service account credential, checked in order:
 *
 * 1. `FIREBASE_SERVICE_ACCOUNT` env var — raw JSON or base64-encoded JSON.
 * 2. `FIREBASE_SERVICE_ACCOUNT_PATH` env var — path to a JSON key file.
 * 3. A `serviceAccountKey.json` file placed next to this module (local dev
 *    fallback only — this file must never be committed to source control).
 *
 * @returns {Promise<object>} The parsed service account credential.
 * @throws {Error} If no credential can be resolved by any of the above.
 */
export async function getServiceAccount() {
  const fromEnvVar = tryParseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (fromEnvVar) return fromEnvVar;

  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (envPath) {
    const resolved = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH was set but file does not exist: ${resolved}`);
    }
    const raw = await fs.promises.readFile(resolved, "utf8");
    const parsed = tryParseServiceAccount(raw);
    if (!parsed) throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH file found but JSON parse failed: ${resolved}`);
    return parsed;
  }

  const defaultPath = path.join(__dirname, "serviceAccountKey.json");
  if (fs.existsSync(defaultPath)) {
    const raw = await fs.promises.readFile(defaultPath, "utf8");
    const parsed = tryParseServiceAccount(raw);
    if (!parsed) throw new Error(`Failed to parse JSON from ${defaultPath}`);
    return parsed;
  }

  throw new Error(
    "Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT (JSON or base64), " +
      "FIREBASE_SERVICE_ACCOUNT_PATH, or place serviceAccountKey.json next to common/src/config."
  );
}
