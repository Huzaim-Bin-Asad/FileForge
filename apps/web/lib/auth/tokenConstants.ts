/**
 * Split out from refreshToken.ts so middleware.ts (Edge runtime) can import
 * these without pulling in that file's node:crypto import, which Edge doesn't support.
 */
export const REFRESH_TOKEN_COOKIE = "ff_refresh";
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
