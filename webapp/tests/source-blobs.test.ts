import assert from "node:assert/strict";
import test from "node:test";

import {
  createSourceBlobRecord,
  totalBlobSize,
} from "../lib/source-blobs.ts";

function buffer(bytes: number): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

test("crea la fitxa de contingut derivant-ne la mida del buffer", () => {
  const record = createSourceBlobRecord({
    sourceId: "source-1",
    projectId: "project-a",
    mime: "application/pdf",
    data: buffer(2048),
  });
  assert.equal(record.sourceId, "source-1");
  assert.equal(record.projectId, "project-a");
  assert.equal(record.mime, "application/pdf");
  assert.equal(record.size, 2048);
  assert.equal(record.data.byteLength, 2048);
});

test("no crea contingut sense font ni projecte associats", () => {
  assert.throws(
    () =>
      createSourceBlobRecord({
        sourceId: "",
        projectId: "project-a",
        mime: "application/pdf",
        data: buffer(1),
      }),
    /font/,
  );
  assert.throws(
    () =>
      createSourceBlobRecord({
        sourceId: "source-1",
        projectId: "",
        mime: "application/pdf",
        data: buffer(1),
      }),
    /projecte/,
  );
});

test("suma la mida total de diversos continguts", () => {
  assert.equal(totalBlobSize([{ size: 100 }, { size: 250 }, { size: 0 }]), 350);
  assert.equal(totalBlobSize([]), 0);
});
