import { computeDigest } from "./utils/functions/crypto.js";

const name = "agent" + process.argv[2];

// ste4
const config = {
    // host: "http://localhost:8080/?name=" + name,
    host: "http://rtibdi.disi.unitn.it:8080/?name=" + name,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxYzcyYjlhN2JkIiwibmFtZSI6InN0ZTQiLCJpYXQiOjE3MTYzOTU0NjJ9.XycBKqifC-Ce7rHkFWfWM61A8R6ySeLdBMj4mqEzYwI",
};

export const DEBUG = false;

export const tokens = [
    // agentA
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI4M2FlMmYxNTQ2IiwibmFtZSI6ImFnZW50QSIsImlhdCI6MTcxNzA4MDIxMH0.C5BgXWjBVWro-eTxl3vRZZVLidLvOk0e7oQxQIGQdFc",
    // agentB
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgwZTljMmI5YmIyIiwibmFtZSI6ImFnZW50QiIsImlhdCI6MTcxNjU3MTYxOH0.wIjgOVHFIVjfQMaHbTViORJSoZ4Diq2KESXNSBMgG4A",
];

const masterSecret = "master";
const slaveSecret = "slave";
const communicationSecret = "communication";

// used for handshake
export const HANDSHAKE_KEY = computeDigest(masterSecret);

// used for all communications
export const COMMUNICATION_KEY = computeDigest(communicationSecret);

export default config;
