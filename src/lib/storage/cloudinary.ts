import crypto from "crypto";

/**
 * Uploads a file buffer directly to Cloudinary using standard HTTPS REST API.
 * Uses native Node.js crypto and fetch with ZERO external npm dependencies.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured."
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "bootcamp-submissions";

  // Signature string parameters must be sorted alphabetically: folder=...&timestamp=...<secret>
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)], {
    type: mimeType || "application/octet-stream",
  });
  formData.append("file", blob, fileName);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("folder", folder);
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Cloudinary upload error response:", res.status, errorBody);
    throw new Error(`File upload to Cloudinary failed (${res.status}): ${res.statusText}`);
  }

  const data = (await res.json()) as { secure_url: string };
  if (!data.secure_url) {
    throw new Error("Cloudinary response did not contain a secure_url.");
  }

  return data.secure_url;
}
