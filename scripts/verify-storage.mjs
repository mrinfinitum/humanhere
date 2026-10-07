import assert from "node:assert/strict";
import { isOwnedUploadKey, MAX_UPLOAD_BYTES, uploadMetadata } from "../src/lib/storage/validation.ts";

assert.equal(uploadMetadata({ contentType: "image/svg+xml", size: 100 }), null);
assert.equal(uploadMetadata({ contentType: "text/html", size: 100 }), null);
assert.equal(uploadMetadata({ contentType: "__proto__", size: 100 }), null);
for (const size of [0, -1, 0.5, Infinity, "100", MAX_UPLOAD_BYTES + 1]) {
  assert.equal(uploadMetadata({ contentType: "image/jpeg", size }), null);
}
assert.equal(uploadMetadata({ contentType: "video/mp4", size: MAX_UPLOAD_BYTES }).mediaType, "video");
const user = "10000000-0000-4000-8000-000000000001";
const submission = "20000000-0000-4000-8000-000000000001";
const filename = "30000000-0000-4000-8000-000000000001.jpg";
const key = `${user}/${submission}/pending/${filename}`;
assert.equal(isOwnedUploadKey(key, user, submission), true);
assert.equal(isOwnedUploadKey(key, "another-user", submission), false);
assert.equal(isOwnedUploadKey(key, user, "another-submission"), false);
assert.equal(isOwnedUploadKey(`${user}/${submission}/${filename}`, user, submission), false, "registered files must not be accepted as pending uploads");
assert.equal(isOwnedUploadKey(`${user}/${submission}/pending/../${filename}`, user, submission), false);
assert.equal(isOwnedUploadKey(`${key}/extra`, user, submission), false);
console.log("Storage validation passed: file limits, MIME restrictions, ownership, and immutable registered keys.");
