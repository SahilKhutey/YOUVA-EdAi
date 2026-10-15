import test from "node:test";
import assert from "node:assert/strict";
import { aiMentorEnabled, practiceLoadMessage, practiceSubmitMessage } from "./practice-errors.mjs";

test("load messages tell the student what to do for each failure", () => {
  assert.match(practiceLoadMessage(403), /consent/);
  assert.match(practiceLoadMessage(404), /no questions/i);
  assert.match(practiceLoadMessage(401), /log in/i);
  assert.match(practiceLoadMessage(undefined), /reach the server/);
  assert.match(practiceLoadMessage(500), /tell your teacher/i);
});

test("every load and submit message is non-empty and never shows raw error text", () => {
  for (const s of [undefined, 400, 401, 403, 404, 409, 500, 503]) {
    for (const m of [practiceLoadMessage(s), practiceSubmitMessage(s)]) {
      assert.ok(m.length > 10);
      assert.doesNotMatch(m, /Error|Exception|\{|undefined/);
    }
  }
});

test("submit messages distinguish an already-submitted quiz and a lost connection", () => {
  assert.match(practiceSubmitMessage(409), /already submitted/);
  assert.match(practiceSubmitMessage(undefined), /still on this page/);
});

test("AI mentor is off unless the flag is exactly true", () => {
  assert.equal(aiMentorEnabled(undefined), false);
  assert.equal(aiMentorEnabled(""), false);
  assert.equal(aiMentorEnabled("false"), false);
  assert.equal(aiMentorEnabled("1"), false);
  assert.equal(aiMentorEnabled("true"), true);
  assert.equal(aiMentorEnabled("TRUE"), true);
});
