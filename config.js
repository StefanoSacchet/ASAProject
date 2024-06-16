import { computeDigest } from "./utils/functions/crypto.js";

const name = "agent" + process.argv[2];

// ste4
const config = {
    // host: "http://localhost:8080/?name=" + name,
    host: "http://localhost:8080",
    // host: "http://rtibdi.disi.unitn.it:8080/?name=" + name,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIxYzcyYjlhN2JkIiwibmFtZSI6InN0ZTQiLCJpYXQiOjE3MTYzOTU0NjJ9.XycBKqifC-Ce7rHkFWfWM61A8R6ySeLdBMj4mqEzYwI",
};

export const DEBUG = true;

export const tokens = [
    // agentA
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRhOWM1OWJiYThiIiwibmFtZSI6ImFnZW50QSIsImlhdCI6MTcxODUyNDA2N30.tdpI0wE8BtmoXSCOjbV62tzELETuFNqNpmFnivjRRbk",
    // agentB
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5YzU5YmJhOGI3IiwibmFtZSI6ImFnZW50QiIsImlhdCI6MTcxODUyNDA4NX0.mGNq91YiT3W-wzb1JBd6NN42NNBeFI2cuTImYOIqJOg"
];

const handshakeSecret = "master";
const communicationSecret = "communication";

// used for handshake
export const HANDSHAKE_KEY = computeDigest(handshakeSecret);
// used for all communications
export const COMMUNICATION_KEY = computeDigest(communicationSecret);

export default config;
