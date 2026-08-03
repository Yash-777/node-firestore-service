/**
 * Minimal leveled logger shared across modules, so log lines have a
 * consistent `[timestamp] [level] [scope]` prefix without pulling in a
 * heavier logging dependency for a project this size.
 *
 * @param {string} scope - Short name of the calling module, e.g. "graphql".
 * @returns {{ info: Function, warn: Function, error: Function }}
 */
export function createLogger(scope) {
  const prefix = (level) => `[${new Date().toISOString()}] [${level}] [${scope}]`;

  return {
    info: (...args) => console.log(prefix("INFO"), ...args),
    warn: (...args) => console.warn(prefix("WARN"), ...args),
    error: (...args) => console.error(prefix("ERROR"), ...args),
  };
}
