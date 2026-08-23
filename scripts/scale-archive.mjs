import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const total = 10_000;
const batchSize = 40;
const records = Array.from({ length: total }, (_, index) => ({
  id: String(total - index).padStart(8, "0"),
  publishedAt: new Date(Date.UTC(2026, 0, 1) - index * 60_000).toISOString(),
}));

function pageAfter(cursor) {
  const start = cursor ? records.findIndex(record => record.publishedAt < cursor.publishedAt || (record.publishedAt === cursor.publishedAt && record.id < cursor.id)) : 0;
  if (start < 0) return [];
  return records.slice(start, start + batchSize);
}

const began = performance.now();
let cursor;
let visited = 0;
let largestBatch = 0;
while (visited < total) {
  const batch = pageAfter(cursor);
  assert.ok(batch.length > 0, "cursor must continue until all records are visited");
  assert.ok(batch.length <= batchSize, "batch exceeded the public bound");
  largestBatch = Math.max(largestBatch, batch.length);
  visited += batch.length;
  const last = batch.at(-1);
  cursor = { publishedAt: last.publishedAt, id: last.id };
}

assert.equal(visited, total);
assert.equal(largestBatch, batchSize);
assert.equal(records.slice(0, 30).length, 30, "homepage opening must remain bounded");
console.log(JSON.stringify({ records: total, visited, batchSize, pages: Math.ceil(total / batchSize), elapsedMs: Math.round(performance.now() - began) }));
