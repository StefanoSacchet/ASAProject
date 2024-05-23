import crypto from "crypto";

// Utility function to generate ECDSA key pair
function generateECDSAKeyPair() {
    return crypto.generateKeyPairSync("ec", {
        namedCurve: "secp256k1",
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
}

// Generate key pairs for Alice and Bob
const aliceKeyPair = generateECDSAKeyPair();
const bobKeyPair = generateECDSAKeyPair();

console.log("Alice Public Key:", aliceKeyPair.publicKey);
console.log("Bob Public Key:", bobKeyPair.publicKey);

// Function to sign a message
function signMessage(privateKey, message) {
    const sign = crypto.createSign("SHA256");
    sign.update(message);
    sign.end();
    return sign.sign(privateKey, "hex");
}

// Function to verify a message
function verifyMessage(publicKey, message, signature) {
    const verify = crypto.createVerify("SHA256");
    verify.update(message);
    verify.end();
    return verify.verify(publicKey, signature, "hex");
}

// Example message
const messageFromAlice = "Hello Bob, this is Alice";
const messageFromBob = "Hello Alice, this is Bob";

// Alice signs her message
const aliceSignature = signMessage(aliceKeyPair.privateKey, messageFromAlice);
console.log("Alice Signature:", aliceSignature);

// Bob verifies Alice's message
const isAliceMessageAuthentic = verifyMessage(aliceKeyPair.publicKey, messageFromAlice, aliceSignature);
console.log("Is Alice's message authentic?", isAliceMessageAuthentic);

// Bob signs his message
const bobSignature = signMessage(bobKeyPair.privateKey, messageFromBob);
console.log("Bob Signature:", bobSignature);

// Alice verifies Bob's message
const isBobMessageAuthentic = verifyMessage(bobKeyPair.publicKey, messageFromBob, bobSignature);
console.log("Is Bob's message authentic?", isBobMessageAuthentic);
