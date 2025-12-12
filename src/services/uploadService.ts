import type { NoteAttachment } from "../models/Note";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult extends NoteAttachment {
  isTemp: boolean;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export const uploadFile = (
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  const { onProgress, signal } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    // Handle abort signal
    if (signal) {
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Upload cancelled", "AbortError"));
      });
    }

    // Progress event
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    // Load complete
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as UploadResult;
          resolve(result);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    // Error event
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    // Abort event
    xhr.addEventListener("abort", () => {
      reject(new DOMException("Upload cancelled", "AbortError"));
    });

    // Send request
    xhr.open("POST", `${API_BASE_URL}/uploads`);
    xhr.send(formData);
  });
};

// Helper to upload multiple files with individual progress tracking
export interface MultiUploadCallbacks {
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
  onFileComplete?: (fileIndex: number, result: UploadResult) => void;
  onFileError?: (fileIndex: number, error: Error) => void;
}

export const uploadFiles = async (
  files: File[],
  callbacks: MultiUploadCallbacks = {}
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadFile(file, {
        onProgress: (progress) => callbacks.onFileProgress?.(i, progress),
      });
      results.push(result);
      callbacks.onFileComplete?.(i, result);
    } catch (error) {
      callbacks.onFileError?.(i, error as Error);
      throw error;
    }
  }

  return results;
};

