import { ENDPOINTS } from "./endpoints";
import { http } from "./http";

/** Build the multipart body for image/video uploads (expo-image-picker URIs). */
function fileForm(field: string, uris: string[], kind: "image" | "video"): FormData {
  const form = new FormData();
  uris.forEach((uri, i) => {
    const name = uri.split("/").pop() || `${kind}-${i}.${kind === "image" ? "jpg" : "mp4"}`;
    const ext = (name.split(".").pop() || (kind === "image" ? "jpg" : "mp4")).toLowerCase();
    const type =
      kind === "image"
        ? `image/${ext === "jpg" ? "jpeg" : ext}`
        : `video/${ext === "mov" ? "quicktime" : ext}`;
    form.append(field, { uri, name, type } as any);
  });
  return form;
}

/** Media uploads (profile photos + intro video). */
export const uploadApi = {
  /** Upload local image URIs; returns the stored public URLs. */
  async uploadPhotos(uris: string[], token: string): Promise<string[]> {
    const form = fileForm("files", uris, "image");
    const data = await http.upload<{ urls?: string[] }>(ENDPOINTS.upload.photos, form, token);
    return data?.urls ?? [];
  },

  /** Upload one intro video; returns its public URL. */
  async uploadVideo(uri: string, token: string): Promise<string> {
    const form = fileForm("file", [uri], "video");
    const data = await http.upload<{ url?: string }>(ENDPOINTS.upload.video, form, token);
    return data?.url ?? "";
  },
};
