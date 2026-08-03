import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This file lives at <repo-root>/common/src/config/env.js, so 3 levels up
// is always the repo root — regardless of which workspace's script is
// actually running (npm sets process.cwd() to the workspace folder, e.g.
// standalone/import-countries, not the repo root). Resolving the path this
// way means a single .env at the repo root covers every module, with no
// per-workspace .env files needed.
const ROOT_ENV_PATH = path.join(__dirname, "..", "..", "..", ".env");

dotenv.config({ path: ROOT_ENV_PATH });

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
