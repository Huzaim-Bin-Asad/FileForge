/**
 * Vercel's serverless functions hard-cap the request body at 4.5 MB
 * regardless of plan or config — there is no way to raise it. We stay well
 * under that (multipart form-data adds overhead on top of the raw file) so
 * uploads fail with a clear message instead of a platform-level 413.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "4 MB";
