/**
 * Response headers for every page. camera and microphone stay available to this site only, because the live
 * classroom uses them; geolocation is switched off. No content-security-policy is set here: it needs testing in
 * a real browser against the video call and the PWA before it can be turned on safely.
 */
export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];
