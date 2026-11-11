import * as ImagePicker from "expo-image-picker";

import { http } from "./api";
import type { Res } from "@/lib/api/types";

/**
 * Getting a receipt photograph to object storage.
 *
 * The file goes DIRECTLY to storage, never through the API: the server
 * mints a short-lived presigned slot, the device PUTs to it, and only
 * the resulting key comes back. That keeps large bodies off the app
 * servers entirely, and it is why there is no multipart endpoint
 * anywhere in this product — `upload-path.spec.ts` on the backend fails
 * the build if one appears.
 *
 * Three steps, and all three have to succeed before a line can cite a
 * receipt. A key attached to a line whose object never arrived is worse
 * than no receipt at all: the approver sees a broken link at the moment
 * they are deciding whether to pay. The server guards against it too —
 * `addLine` calls `confirmUpload(receiptKey)` — so a half-finished
 * upload fails at the line, not silently.
 */

export interface CapturedReceipt {
  uri: string;
  filename: string;
  contentType: string;
}

/**
 * Whether the camera is usable, asking only when it might be.
 *
 * Permission is requested at the point of use rather than on mount. A
 * camera prompt that appears because someone opened the expenses screen
 * is a prompt they decline, and a declined permission is sticky.
 */
export async function captureFromCamera(): Promise<CapturedReceipt | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    // Receipts are read, not admired. Compressing here is the difference
    // between a 4MB upload and a 400KB one on a phone paying for its own
    // data, and the text stays legible.
    quality: 0.6,
    allowsEditing: false,
    exif: false,
  });

  return firstAsset(result);
}

/** The library, for a receipt already photographed or emailed over. */
export async function pickFromLibrary(): Promise<CapturedReceipt | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.6,
    allowsEditing: false,
    exif: false,
  });

  return firstAsset(result);
}

function firstAsset(result: ImagePicker.ImagePickerResult): CapturedReceipt | null {
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  // The picker does not always report a mime type, and the server
  // refuses a type it does not allow — so a missing one is inferred from
  // the extension rather than sent blank, which would be refused for the
  // wrong reason and read as "receipts do not work".
  const contentType = asset.mimeType ?? inferType(asset.uri);

  return {
    uri: asset.uri,
    filename: asset.fileName ?? `receipt-${Date.now()}.${extensionFor(contentType)}`,
    contentType,
  };
}

function inferType(uri: string): string {
  const extension = uri.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "heic" || extension === "heif") return "image/heic";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

function extensionFor(contentType: string): string {
  return contentType.split("/").pop() ?? "jpg";
}

/** Where to PUT the photo, and the key to send back as `receiptKey`. */
type UploadSlot = Res<"POST /me/expenses/receipt-upload-url">;

/**
 * Uploads a captured receipt and returns the key to cite.
 *
 * Throws rather than returning null on failure, so the caller cannot
 * accidentally attach a line with no receipt behind it — see the note at
 * the top about what a dangling key costs an approver.
 */
export async function uploadReceipt(receipt: CapturedReceipt): Promise<string> {
  const { data: slot } = await http.post<UploadSlot>("/me/expenses/receipt-upload-url", {
    filename: receipt.filename,
    contentType: receipt.contentType,
  });

  const body = await fetch(receipt.uri).then((response) => response.blob());

  const put = await fetch(slot.uploadUrl, {
    method: "PUT",
    // NOT the app's axios instance. The presigned URL is signed for the
    // exact headers below, and an Authorization header or a company
    // scope added by an interceptor changes the signature and is
    // refused by storage — with an error that says nothing useful.
    headers: { ...slot.requiredHeaders, "Content-Type": receipt.contentType },
    body,
  });

  if (!put.ok) {
    throw new Error(
      "The receipt could not be uploaded. Check your connection and try again.",
    );
  }

  return slot.key;
}
