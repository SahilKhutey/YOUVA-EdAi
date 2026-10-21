import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderChatMarkdown } from "./chat-text.mjs";
import { forumEnabled, isOn } from "./features.mjs";
import { aiMentorEnabled } from "./practice-errors.mjs";
import { securityHeaders } from "./security-headers.mjs";

test("chat text never lets a tag through", () => {
  const attacks = [
    '<img src=x onerror="alert(1)">',
    "<script>alert(document.cookie)</script>",
    '"><svg onload=alert(1)>',
    "**<b onmouseover=alert(1)>x</b>**",
    "<a href='javascript:alert(1)'>click</a>",
  ];
  for (const a of attacks) {
    const html = renderChatMarkdown(a);
    const withoutOurTags = html.replace(/<\/?(strong|em)>/g, "");
    assert.doesNotMatch(withoutOurTags, /</, `raw < survived in: ${html}`);
    assert.doesNotMatch(withoutOurTags, />/, `raw > survived in: ${html}`);
  }
});

test("chat text still formats bold and italic, and keeps ordinary punctuation readable", () => {
  assert.equal(renderChatMarkdown("**bold** and *italic*"), "<strong>bold</strong> and <em>italic</em>");
  assert.equal(renderChatMarkdown("2 < 3 & 5 > 4"), "2 &lt; 3 &amp; 5 &gt; 4");
  assert.equal(renderChatMarkdown(undefined), "");
  assert.equal(escapeHtml(`"'`), "&quot;&#39;");
});

test("feature switches are off unless exactly true", () => {
  for (const off of [undefined, "", "false", "1", "yes"]) {
    assert.equal(isOn(off), false);
    assert.equal(forumEnabled(off), false);
    assert.equal(aiMentorEnabled(off), false);
  }
  assert.equal(forumEnabled("TRUE"), true);
  assert.equal(aiMentorEnabled("true"), true);
});

test("security headers are present and keep the camera and microphone the classroom needs", () => {
  const h = Object.fromEntries(securityHeaders.map((x) => [x.key, x.value]));
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.equal(h["X-Frame-Options"], "SAMEORIGIN");
  assert.match(h["Referrer-Policy"], /strict-origin/);
  assert.match(h["Permissions-Policy"], /camera=\(self\)/);
  assert.match(h["Permissions-Policy"], /microphone=\(self\)/);
  assert.match(h["Permissions-Policy"], /geolocation=\(\)/);
});
