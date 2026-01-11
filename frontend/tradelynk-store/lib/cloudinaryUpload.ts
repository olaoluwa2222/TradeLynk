// lib/cloudinaryUpload.ts

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image to Cloudinary via your backend API
 * @param file - The image file to upload
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with upload result
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResult> {
  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "Please upload an image file",
      };
    }

    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Image size must be less than 2MB",
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append("image", file);

    // Upload with progress tracking
    const xhr = new XMLHttpRequest();

    return new Promise((resolve) => {
      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        // Accept both 200 and 201 as success status codes
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              resolve({
                success: true,
                url: response.data.url,
                publicId: response.data.publicId,
              });
            } else {
              resolve({
                success: false,
                error: response.message || "Upload failed",
              });
            }
          } catch (error) {
            resolve({
              success: false,
              error: "Invalid response from server",
            });
          }
        } else {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}`,
          });
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        resolve({
          success: false,
          error: "Network error during upload",
        });
      });

      xhr.addEventListener("abort", () => {
        resolve({
          success: false,
          error: "Upload cancelled",
        });
      });

      // Get auth token
      const token = localStorage.getItem("accessToken");

      // Send request
      xhr.open(
        "POST",
        "https://tradelynk-api-t598w.ondigitalocean.app/api/v1/images/upload"
      );
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null
 */
export function extractPublicId(url: string): string | null {
  try {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    return null;
  }
}
