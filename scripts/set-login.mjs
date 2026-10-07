#!/usr/bin/env node
/*
 * Sets the (single, static) login of the site.
 *   npm run set-login -- <userId> <password>
 * Only a salted, iterated SHA-256 hash is written to src/auth/credentials.ts — never the password itself.
 */
import { createHash, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [userId, password] = process.argv.slice(2);
if (!userId || !password) { console.error("usage: npm run set-login -- <userId> <password>"); process.exit(1); }
if (password.length < 8) { console.error("Use a password of at least 8 characters."); process.exit(1); }

const sha = (s) => createHash("sha256").update(s).digest("hex");
const salt = randomBytes(12).toString("hex");
const rounds = 20000;
let h = sha(`${salt}\n${userId}\n${password}`);
for (let i = 0; i < rounds; i++) h = sha(h + salt);

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "auth", "credentials.ts");
writeFileSync(file, `// Written by scripts/set-login.mjs — do not edit by hand. Only a salted hash is stored, never the password.
export const SALT = "${salt}";
export const ROUNDS = ${rounds};
export const CREDENTIAL_HASH = "${h}";
`);
console.log(`Login updated for user "${userId}". Rebuild and redeploy for it to take effect.`);
