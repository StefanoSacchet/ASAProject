import crypto from "crypto";

export function computeDigest(message) {
    const hash = crypto.createHash("sha1");
    hash.update(message);
    return hash.digest("hex");
}
