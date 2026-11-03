import assert from "node:assert/strict";
import { placeCentroid } from "../src/lib/geo/places.ts";
import { personalInfoReason } from "../src/lib/moderation/personal-info.ts";

// Stories that look like they share a way to find or contact someone wait for staff.
for (const text of [
  "Call me at 918-555-0142 if you can help.", "My number is (405) 555 0199", "text +1 918.555.0142",
  "email me at maya.lane@example.com", "I sleep near 1420 N Peoria Ave most nights", "We moved to 22 Oak Street last week",
]) assert.ok(personalInfoReason(text), `should hold: ${text}`);
for (const text of [
  "I was 19 when it happened, in 2014.", "We lost 3 jobs in 2 years.", "Tulsa, Oklahoma", "I walk 5 miles every day",
  "Room 101 changed my life", "Psalm 23 gets me through", "I drive on Route 66 to work",
]) assert.equal(personalInfoReason(text), null, `should post: ${text}`);

// Typed places become approximate centroids, never more precise than a city.
const tulsa = placeCentroid("Tulsa, OK");
assert.equal(tulsa?.precision, "city");
assert.ok(Math.abs(tulsa.latitude - 36.15) < 0.1 && Math.abs(tulsa.longitude + 95.99) < 0.1);
assert.equal(placeCentroid("tulsa, oklahoma")?.label, "Tulsa");
assert.equal(placeCentroid("Tulsa")?.label, "Tulsa");
assert.equal(placeCentroid("Portland"), null, "an ambiguous city gets no pin");
assert.equal(placeCentroid("Portland, Maine")?.latitude, 43.66);
assert.equal(placeCentroid("Somewhere small, Oklahoma")?.precision, "region");
assert.equal(placeCentroid("Oklahoma")?.label, "Oklahoma");
assert.equal(placeCentroid("Lagos, Nigeria")?.precision, "city");
assert.equal(placeCentroid("São Paulo")?.label, "São Paulo");
assert.equal(placeCentroid("Kenya")?.precision, "country");
assert.equal(placeCentroid("my aunt's couch"), null);
assert.equal(placeCentroid(""), null);
assert.equal(placeCentroid("OK"), null, "a bare state code is too vague to trust");

console.log("Instant publishing checks passed");
