import "dotenv/config";

import { Storage } from "@google-cloud/storage";

// Google Cloud Storage client.
//
// Auth is resolved from GOOGLE_APPLICATION_CREDENTIALS (a path to the service
// account JSON key) when set, otherwise from Application Default Credentials
// (`gcloud auth application-default login`). projectId is optional once the
// key file is provided, since it carries the project.
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET;
const bucket = storage.bucket(bucketName);

/**
 * Upload a buffer to the bucket and return its public URL.
 *
 * The bucket is configured for public reads (allUsers -> Storage Object
 * Viewer), so no per-object ACL call is needed and the object is reachable at
 * a stable https://storage.googleapis.com/<bucket>/<name> URL.
 *
 * @param {Buffer} buffer      File contents.
 * @param {string} objectName  Destination path/key within the bucket.
 * @param {string} contentType MIME type (e.g. "image/png").
 * @returns {Promise<string>}  Public URL of the uploaded object.
 */
export async function uploadPublicFile(buffer, objectName, contentType) {
  const file = bucket.file(objectName);

  await file.save(buffer, {
    contentType,
    // Long cache lifetime since object names are unique per upload.
    metadata: { cacheControl: "public, max-age=31536000" },
    resumable: false,
  });

  return `https://storage.googleapis.com/${bucketName}/${objectName}`;
}

/** Delete an object by its path/key within the bucket. */
export async function deleteFile(objectName) {
  await bucket.file(objectName).delete({ ignoreNotFound: true });
}

export { bucket, bucketName };
