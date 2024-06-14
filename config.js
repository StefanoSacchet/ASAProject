import { computeDigest } from "./utils/functions/crypto.js";

const name = "agent" + process.argv[2];

// ste4
const config = {
    host: "http://localhost:8080/?name=" + name,
    // host: "http://rtibdi.disi.unitn.it:8080/?name=" + name,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxYzcyYjlhN2JkIiwibmFtZSI6InN0ZTQiLCJpYXQiOjE3MTYzOTU0NjJ9.XycBKqifC-Ce7rHkFWfWM61A8R6ySeLdBMj4mqEzYwI",
};

export const DEBUG = true;

export const tokens = [
    // agentA
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc3NzdjYTgzZjFjIiwibmFtZSI6ImFnZW50QSIsImlhdCI6MTcxNzQ5MjY5N30.6vNuaeK3F9PDRMiAI10Q5adHuc5Bnu94m8EwiiFLLgo",
    // agentB
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgwZTljMmI5YmIyIiwibmFtZSI6ImFnZW50QiIsImlhdCI6MTcxNjU3MTYxOH0.wIjgOVHFIVjfQMaHbTViORJSoZ4Diq2KESXNSBMgG4A",
];

const handshakeSecret = "master";
const communicationSecret = "communication";

// used for handshake
export const HANDSHAKE_KEY = computeDigest(handshakeSecret);
// used for all communications
export const COMMUNICATION_KEY = computeDigest(communicationSecret);

export default config;
