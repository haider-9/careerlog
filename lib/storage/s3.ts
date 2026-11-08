import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const DOCUMENTS_BUCKET = "careerlog-documents";

let client: S3Client | undefined;

export function getStorageClient() {
  const region = process.env.AWS_REGION;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Neon Object Storage is not configured for this branch.");
  }

  client ??= new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

export async function deleteStoredDocument(storageKey: string) {
  await getStorageClient().send(new DeleteObjectCommand({ Bucket: DOCUMENTS_BUCKET, Key: storageKey }));
}