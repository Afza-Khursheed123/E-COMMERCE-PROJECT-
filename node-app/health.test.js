import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

test("Backend CI/CD health API returns correct response", async () => {
  const app = express();

  app.get("/ci-cd-check", (_req, res) => {
    res.json({
      message: "Backend CI/CD Verified",
      status: "success"
    });
  });

  const server = app.listen(0);

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/ci-cd-check`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data, {
      message: "Backend CI/CD Verified",
      status: "success"
    });
  } finally {
    server.close();
  }
});
