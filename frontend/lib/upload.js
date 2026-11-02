import { api, getApiError } from './api';

/**
 * Uploads one image → { url, publicId }.
 * ⚠️ Axios v1 deletes the JSON Content-Type when data is FormData, letting the browser
 * set the multipart boundary. If you ever force a content-type header here, uploads break.
 */
export async function uploadImage(file, kind) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  try {
    const res = await api.post('/uploads', fd);
    return res.data.data; // { url, publicId }
  } catch (err) {
    throw new Error(getApiError(err).message);
  }
}