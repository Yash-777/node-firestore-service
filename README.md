# firebase-custom-importer

Node.js project that functions like a single Java class where you execute specific methods via command-line arguments (using enums/constants to pick the operation), you can follow the structure below.

## Project Structure

```
firebase-custom-importer/
        ├── .env                    # Environment variables (Firebase credentials path)
        ├── serviceAccountKey.json  # Your Firebase Service Account key
        ├── importCountriesList.js  # The main execution file
        └── package.json            # Project dependencies
```

1. package.json

Since you mentioned you don't have standard web scripts, you can use node directly. I have added a start script for convenience, but you can run it manually as requested.

```json
{
  "name": "firebase-custom-auth-importer",
  "version": "1.0.0",
  "description": "CLI tool for Firebase operations",
  "main": "importCountriesList.js",
  "dependencies": {
    "dotenv": "^16.4.5",
    "firebase-admin": "^13.7.0",
    "cross-env": "^7.0.3",
    "json5": "^2.2.3"
  }
}
```
2. importCountriesList.js

This file acts as your **"Main Class."** It uses an object to simulate an Enum and a switch-like logic to execute methods based on the command-line argument.

```js
require('dotenv').config();
const admin = require('firebase-admin');
const JSON5 = require('json5');

// 1. Initialize Firebase Admin SDK
// As per Firebase docs, you need the service account key from:
// Settings > Service accounts > Generate New Private Key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * Enum-like constant for CRUD operations
 */
const Operations = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
};

/**
 * Logic for CRUD Operations
 */
const Actions = {
  [Operations.CREATE]: async (data) => {
    console.log("Executing CREATE operation...");
    // Example: Adding a country
    const res = await db.collection('countries').add({ name: 'United States', code: 'US' });
    console.log('Added document with ID: ', res.id);
  },

  [Operations.READ]: async () => {
    console.log("Executing READ operation...");
    const snapshot = await db.collection('countries').get();
    snapshot.forEach(doc => console.log(doc.id, '=>', doc.data()));
  },

  [Operations.UPDATE]: async (id) => {
    console.log(`Executing UPDATE on ID: ${id}...`);
    // Logic for update
  },

  [Operations.DELETE]: async (id) => {
    console.log(`Executing DELETE on ID: ${id}...`);
    // Logic for delete
  }
};

// 2. Execution Logic (The "Main" method)
const args = process.argv.slice(2);
const methodArg = args[0] ? args[0].toUpperCase() : null;

if (!methodArg || !Operations[methodArg]) {
  console.error(`Please provide a valid operation: ${Object.keys(Operations).join(', ')}`);
  process.exit(1);
}

// Execute the chosen method
Actions[methodArg](args[1])
  .then(() => {
    console.log("Operation completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Operation failed:", err);
    process.exit(1);
  });
```

## Properties

```bash
FIRESTORE_DATABASE_ID=(default)                                # which Firestore database
FIRESTORE_COUNTRY_COLLECTION_PATH=master_data/countries/items  # which collection path
```

## Install

```bash
npm install        # installs all required dependencies
```

Copy `.env.example` to `.env` at the repo root and fill in a Firebase
credential (`FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_PATH`).

## How to run it

To execute a specific "method" from your terminal, pass the constant name as a parameter:

To Create/Import:

```bash
node ./importCountriesList.js CREATE
```

To Read:
```bash
node ./importCountriesList.js READ
```

## Notes

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

----

#### Integration with Firebase Custom Auth

As noted in the Firebase Custom Authentication documentation, if you intend to use this server-side logic to generate tokens for your users, you would add a method like this to your Actions object:

```js
const createToken = async (uid) => {
  try {
    const customToken = await admin.auth().createCustomToken(uid);
    console.log("Generated Custom Token:", customToken);
    return customToken;
  } catch (error) {
    console.error("Error creating custom token:", error);
  }
};
```

This token would then be sent to your **client-side application** to be used with `signInWithCustomToken(auth, token)`.