/** A frontend feature is on only when its NEXT_PUBLIC_* value is exactly "true" (any case). */
export function isOn(flag) {
  return String(flag ?? "").toLowerCase() === "true";
}

/** The discussion forum link is shown only when NEXT_PUBLIC_ENABLE_FORUM is true. */
export function forumEnabled(flag) {
  return isOn(flag);
}
