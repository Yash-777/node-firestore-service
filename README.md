# node-firestore-service

Node.js >= 24.0.0. npm workspaces monorepo separating the **web module**
(Apollo GraphQL API) from the **standalone** script (one-off Firestore
import), sharing a **common** package for config, Firebase client, generic
Firestore utils, and reference JSON data.

## Structure

```
node-firestore-service/
  package.json                    root workspaces + convenience scripts
  .env.example                    documents every dynamic config value
  common/                         @node-firestore-service/common
    src/
      config/
        env.js                    generic readEnv() helper
        serviceAccount.js         resolves Firebase credentials (3 fallbacks)
        firebaseClient.js         dynamic db-id + dynamic collection-path resolution
      utils/
        firestoreHelper.js        docToObject / collectionToList
        logger.js                 leveled console logger
      data/
        AllCountries.json         shared reference data (now includes `region`)
      index.js                    barrel export
  webmodule/
    graphql/                      node-firestore-service-graphql
      src/
        index.js                  Express + Apollo Server bootstrap
        config/env.js             port, graphql path, CORS, dynamic Firestore target
        graphql/typeDefs.js
        graphql/resolvers.js
        services/countryMasterService.js
  standalone/
    import/                       node-firestore-service-import
      src/
        importAllCountries.js     entrypoint: `node src/importAllCountries.js`
        importHelpers.js          Firestore + shared-JSON loading helpers
        config/env.js             dynamic Firestore target (same shape as graphql module)
```

## What's dynamic now

The original script hardcoded `master_data` / `countries` / `items`.
That's now driven entirely by two env vars, read identically by both the
GraphQL module and the import script:

```bash
FIRESTORE_DATABASE_ID=(default)                                # which Firestore database
FIRESTORE_COUNTRY_COLLECTION_PATH=master_data/countries/items  # which collection path
```

`common/src/config/firebaseClient.js` exposes `getDb({ databaseId })` (uses
`getFirestore(app, databaseId)` for named, non-default Firestore databases)
and `resolveCollection(db, pathSegments)` (turns the path array into a
`CollectionReference` — Firestore accepts a single slash-joined path).
Change the collection or database anywhere without touching code.

## Install

```bash
npm install        # installs all 3 workspaces (common, graphql, import)
```

Copy `.env.example` to `.env` at the repo root and fill in a Firebase
credential (`FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_PATH`).

## Run

```bash
#npm run start:graphql      # GraphQL API on http://localhost:4000/graphql
#npm run dev:graphql        # same, with --watch
#npm run standalone:import  # runs the standalone Firestore import script

npm start --workspace=standalone\import -- create
npm start --workspace=standalone\import -- fetch
npm start --workspace=standalone\import -- clear

npm start --workspace=webmodule\graphql
cd standalone\import && npm start create
```

Or from inside either module folder directly: `npm start`.

## Endpoints (webmodule/graphql)

- `GET /health-check`
- `POST /graphql` — e.g. `{ getAllCountries { countryCode countryName region } }`

## Notes

- `common` is a real workspace package (`@node-firestore-service/common`),
  not a relative-path hack — both other modules `import` from it by name.
- Never commit `.env` or a real `serviceAccountKey.json`; both are
  gitignored.

----

## Firestore dependency

 - **firebase-admin (Recommended for Backend / Standalone Scripts):**
This is the official administrative SDK for Firebase. You should use this package if you are writing backend code, API servers, or Cloud Functions. It bypasses Firestore Security Rules and grants full administrative access to your database using a secure service account credential.

 - **firebase (Recommended for Web / End-Users):**
   This is the standard client-side SDK. Use this package if you are building web/frontend applications (like React, Vue, or Next.js) or client-side Node.js applications (such as desktop or IoT apps). This SDK authenticates end-users and is strictly bound by your Firestore Security Rules.

----

## To enable modern ES6 `import/export` syntax natively in Node.js, you need to add the `"type": "module"` field to your `package.json`.

1. Option A: **`ES6 Modules`** (Modern import)

The `package.json` Configuration. Here is how you add it:

```json
{
  "name": "firestore-practice",
  "version": "1.0.0",
  "type": "module",  // <-- Add this line to enable ES6 module (ESM) syntax
  "main": "app.js",
  "dependencies": {
    "firebase-admin": "^14.2.0"
  }
}
```
Use this when `"type": "module"` is in your `package.json`

Exporting (`db.js`):
```js
// db.js
// ES6 named export syntax
export function getDbStatus() {
  return "Database is active and ready!";
}
```
Importing (`app.js`):
```js
// app.js
// ES6 import syntax. 
// CRITICAL: In Node.js ESM, you MUST explicitly include the ".js" file extension!
import { getDbStatus } from './db.js';

console.log(getDbStatus());
```

When using ES-Module `type = module`. instead of `import` if you use `reqire` it leads to below error

```js
const { getFirestore } = require('firebase-admin/firestore');

Error:
    ReferenceError: require is not defined in ES module scope, you can use import instead
This file is being treated as an ES module because it has a '.js' file extension and 'node-firestore-service\standalone\import\package.json' contains "type": "module". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
    at file:///D:/node-firestore-service/standalone/import/src/importAllCountries.js:130:26
    at ModuleJob.run (node:internal/modules/esm/module_job:303:25)
at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:663:26)
at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:99:5)
```

2. Option B: `CommonJS` (Standard `Node.js` require)

Use this if `"type": "module" is not in your package.json`.

Exporting (db.js):
```js
// db.js
function getDbStatus() {
  return "Database is active and ready!";
}

// CommonJS export syntax
module.exports = { getDbStatus };
```

Importing (app.js):
```js
// app.js
// CommonJS require syntax
const { getDbStatus } = require('./db.js');

console.log(getDbStatus());
```

----

Standard JSON strictly adheres to the data-only specification, which does not natively support comments. If a JSON file contains `//` or `/* ... */`, helper tools like `fs.readJson` (from fs-extra) or the native `JSON.parse` will throw a syntax error.

```js
export async function loadCommonJsonFile_RawDataWithoutComments(fileName) {
    const filePath = path.join(COMMON_DATA_DIR, fileName);
    return fs.readJson(filePath);
}
```

To resolve this issue and allow your configuration files to contain comments, you must load the file as a raw text string, strip out the comments, and then parse it.

Here are the two best, industry-standard ways to modify your code:

> Option 1: Using `strip-json-comments` (Recommended & Lightweight)

The `strip-json-comments` library replaces single-line (`//`) and multi-line (`/* */`) comments with whitespace, allowing the JSON parser to run without throwing errors.

First, install the package: `npm install strip-json-comments`
Then, update your function to read the file as a raw string and parse it:
```js
import fs from 'fs/promises';
import path from 'path';
import stripJsonComments from 'strip-json-comments';

export async function loadCommonJsonFile(fileName) {
    const filePath = path.join(COMMON_DATA_DIR, fileName);

    // 1. Read the file as a raw text string (instead of parsing immediately)
    const rawText = await fs.readFile(filePath, 'utf8');

    // 2. Strip comments and parse standard JSON
    return JSON.parse(stripJsonComments(rawText));
}
```
> Option 2: Using the **json5** Library (More Robust)

If you also want to support features like `trailing commas`, `single-quoted strings`, or `unquoted keys alongside comments`, **`JSON5`** is the perfect library.

First, install the package: `npm install json5`

Then, update your function:

```js
import fs from 'fs/promises';
import path from 'path';
import JSON5 from 'json5';

export async function loadCommonJsonFile(fileName) {
    const filePath = path.join(COMMON_DATA_DIR, fileName);

    // 1. Read the file as raw text
    const rawText = await fs.readFile(filePath, 'utf8');

    // 2. Parse using JSON5 instead of standard JSON
    return JSON5.parse(rawText);
}
```