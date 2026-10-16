/** Request limits per client IP per minute. Login and sign-up are the strictest. */
export const MINUTE = 60_000;
export const DEFAULT_THROTTLE = { name: 'default', ttl: MINUTE, limit: 120 };
export const LOGIN_THROTTLE = { default: { ttl: MINUTE, limit: 20 } };
export const REGISTER_THROTTLE = { default: { ttl: MINUTE, limit: 10 } };
