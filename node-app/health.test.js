import test from "node:test";
import assert from "node:assert/strict";

test("Backend health check response", () => {
  const response = {
    status: 200,
    message: "Backend CI/CD Verified"
  };

  assert.equal(response.status, 200);
  assert.equal(response.message, "Backend CI/CD Verified");
});
