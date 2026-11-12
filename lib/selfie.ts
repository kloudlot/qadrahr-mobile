import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

/**
 * The photo taken with a clock-in made offline, where the organisation
 * asks for a face check.
 *
 * With no connection there can be no sitting: the capture page cannot
 * load and the server cannot be asked. So the app takes one photo with the
 * front camera and queues it with the punch. When the queue syncs the
 * server matches the face — and flags the punch all the same, because one
 * photo cannot show the person was there.
 *
 * Kept in the app's own documents folder rather than left in the camera's
 * cache: a punch can wait hours for a connection, and the OS empties
 * caches when it is short of space. Deleted as soon as its punch is on the
 * server (lib/punchSync.ts).
 */

const FOLDER = "queued-selfies";

/**
 * Takes the photo. Null when the employee cancels or the camera is not
 * allowed: the punch is still queued, without one, and the server flags it.
 * Refusing to record a clock-in over a camera prompt would lose a real
 * punch to guard against a fake one.
 */
export async function takeQueuedSelfie(clientPunchId: string): Promise<string | null> {
  try {
    const existing = await ImagePicker.getCameraPermissionsAsync();
    const permission = existing.granted ? existing : await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      cameraType: ImagePicker.CameraType.front,
      // A face for matching, not a portrait: small is quicker to send on
      // the poor connection that put this punch in the queue.
      quality: 0.5,
      allowsEditing: false,
      exif: false,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return null;

    try {
      const folder = new Directory(Paths.document, FOLDER);
      if (!folder.exists) folder.create({ intermediates: true });
      const kept = new File(folder, `${clientPunchId}.jpg`);
      new File(asset.uri).copy(kept);
      return kept.uri;
    } catch {
      // Could not be moved somewhere safer. Where the camera left it will do.
      return asset.uri;
    }
  } catch {
    return null;
  }
}
