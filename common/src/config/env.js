// common/src/config/env.js
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// This file lives at <repo-root>/common/src/config/env.js, so 3 levels up
// is always the repo root — regardless of which workspace's script is
// actually running (npm sets process.cwd() to the workspace folder, e.g.
// standalone/import-countries, not the repo root). Resolving the path this
// way means a single .env at the repo root covers every module, with no
// per-workspace .env files needed.
//const ROOT_ENV_PATH = path.join(__dirname, "..", "..", "..", ".env");

// Adjusted path logic depending on where your env.js file is stored.
// If env.js is in src/config/env.js, 3 levels up is the repository root.
const REPO_ROOT = path.join(import.meta.dirname, "..", "..", "..");

const envMode = process.env.NODE_ENV; // can be "dev", "local", or undefined

if (envMode === "dev") {
  console.log("Loading environment variables from .env.dev...");

  const devEnvPath = path.join(REPO_ROOT, ".env.dev");

  // If environment is dev, but .env.dev is missing, throw exception and crash
  if (!fs.existsSync(devEnvPath)) {
    throw new Error(
        `CRITICAL ERROR: Environment is set to "dev", but the required configuration file is missing at: ${devEnvPath}`
    );
  }

  dotenv.config({ path: devEnvPath });
} else if (envMode === "local") {
  console.log("Loading environment variables from .env.local...");

  const localEnvPath = path.join(REPO_ROOT, ".env.local");

  // If environment is local, but .env.local is missing, throw exception and crash
  if (!fs.existsSync(localEnvPath)) {
    throw new Error(
        `CRITICAL ERROR: Environment is set to "local", but the required configuration file is missing at: ${localEnvPath}`
    );
  }

  dotenv.config({ path: localEnvPath });
} else {
  console.log("Loading environment variables from .env or .env.local...");
  const baseEnvPath = path.join(REPO_ROOT, ".env");
  const localEnvPath = path.join(REPO_ROOT, ".env.local");

  // Fallback chain: 
  // 1. Try to load .env
  // 2. If .env is not available, default to .env.local
  if (fs.existsSync(baseEnvPath)) {
    console.log("Loading environment variables from .env...");
    dotenv.config({ path: baseEnvPath });
  } else if (fs.existsSync(localEnvPath)) {
    console.log("Loading environment variables from .env.local...");
    dotenv.config({ path: localEnvPath });
  } else {
    console.warn("Warning: Neither '.env' nor '.env.local' was found at root.");
    throw new Error(
        `CRITICAL ERROR: Neither '.env' nor '.env.local' was found at root.`
    );
  }
}

/**
 * Reads a single environment variable with an optional default, throwing
 * when it is marked required but absent. Centralizing this in `common`
 * means every module (webmodule/graphql, standalone/import-countries)
 * resolves configuration the exact same way, instead of each package
 * reaching into `process.env` directly.
 *
 * @param {string} key - Environment variable name.
 * @param {object} [options]
 * @param {boolean} [options.required=false] - Throw if the value is missing.
 * @param {string} [options.default] - Fallback value when unset.
 * @returns {string|undefined} The resolved value.
 * @throws {Error} If `required` is true and no value/default is available.
 */
export function readEnv(key, { required = false, default: fallback } = {}) {
  const value = process.env[key] ?? fallback;

  if (required && (value === undefined || value === "")) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}


export const firestore = {
  // Dynamic Firestore database name (Firebase projects can host several
  // named databases). Defaults to the project's default database.
  databaseId: readEnv("FIRESTORE_DATABASE_ID", { default: "(default)" }),

  // Dynamic collection path, e.g. "master_data/countries/items".
  // Split on "/" so callers can pass it straight into resolveCollection().
  countryCollectionPath: readEnv("FIRESTORE_COUNTRY_COLLECTION_PATH", {
    default: "master_data/countries/items",
  }).split("/"),
  // Dynamic collection path, e.g. FIRESTORE_COUNTRYMASTER_COLLECTION_PATH=master_data/countrymaster/items.
  // Split on "/" so callers can pass it straight into resolveCollection().
  countryMasterCollectionPath: readEnv("FIRESTORE_COUNTRYMASTER_COLLECTION_PATH", {
    default: "master_data/country_master/items",
  }).split("/"),
  dealerCollectionPath: readEnv("FIRESTORE_DEALER_COLLECTION_PATH", {
    default: "master_data/dealers/items",
  }).split("/"),
};
