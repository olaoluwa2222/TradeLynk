package com.codewithola.tradelynkapi.services;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.codewithola.tradelynkapi.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    private final Cloudinary cloudinary;

    // Maximum file size: 2 MB (in bytes)
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    // Allowed image formats
    private static final List<String> ALLOWED_FORMATS = Arrays.asList("jpg", "jpeg", "png", "webp");

    // Allowed MIME types
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    /**
     * Upload a single image to Cloudinary
     * @param file - MultipartFile image
     * @return Map containing url and publicId
     */
    public Map<String, String> uploadImage(MultipartFile file) {
        log.info("Uploading image to Cloudinary: {}", file.getOriginalFilename());

        // Validate image
        validateImage(file);

        try {
            // Upload to Cloudinary with options
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", "marketplace/items",
                    "resource_type", "image",
                    "quality", "auto",
                    "fetch_format", "auto"
            );

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            String url = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            log.info("Image uploaded successfully. URL: {}", url);

            return Map.of(
                    "url", url,
                    "publicId", publicId
            );

        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Failed to upload image. Please try again.");
        }
    }

    /**
     * Upload multiple images to Cloudinary
     * @param files - Array of MultipartFile images
     * @return List of Maps containing url and publicId for each image
     */
    public List<Map<String, String>> uploadMultipleImages(List<MultipartFile> files) {
        log.info("Uploading {} images to Cloudinary", files.size());

        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No images provided for upload");
        }

        if (files.size() > 5) {
            throw new BadRequestException("Maximum 5 images allowed per upload");
        }

        return files.stream()
                .map(this::uploadImage)
                .toList();
    }

    /**
     * Delete an image from Cloudinary
     * @param publicId - Cloudinary public ID of the image
     */
    public void deleteImage(String publicId) {
        log.info("Deleting image from Cloudinary: {}", publicId);

        if (publicId == null || publicId.trim().isEmpty()) {
            throw new BadRequestException("Public ID is required to delete image");
        }

        try {
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String status = (String) result.get("result");

            if ("ok".equals(status)) {
                log.info("Image deleted successfully: {}", publicId);
            } else {
                log.warn("Image deletion returned status: {} for publicId: {}", status, publicId);
            }

        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary", e);
            throw new RuntimeException("Failed to delete image. Please try again.");
        }
    }

    /**
     * Delete multiple images from Cloudinary
     * @param publicIds - List of Cloudinary public IDs
     */
    public void deleteMultipleImages(List<String> publicIds) {
        log.info("Deleting {} images from Cloudinary", publicIds.size());

        if (publicIds == null || publicIds.isEmpty()) {
            return;
        }

        publicIds.forEach(this::deleteImage);
    }

    /**
     * Extract public ID from Cloudinary URL
     * @param cloudinaryUrl - Full Cloudinary URL
     * @return Public ID
     */
    public String extractPublicIdFromUrl(String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isEmpty()) {
            return null;
        }

        try {
            // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/marketplace/items/abc123.jpg
            // Public ID: marketplace/items/abc123

            String[] parts = cloudinaryUrl.split("/upload/");
            if (parts.length < 2) {
                return null;
            }

            String afterUpload = parts[1];
            // Remove version number (v1234567890/)
            String withoutVersion = afterUpload.replaceFirst("v\\d+/", "");
            // Remove file extension
            int lastDotIndex = withoutVersion.lastIndexOf('.');
            if (lastDotIndex > 0) {
                return withoutVersion.substring(0, lastDotIndex);
            }

            return withoutVersion;

        } catch (Exception e) {
            log.error("Failed to extract public ID from URL: {}", cloudinaryUrl, e);
            return null;
        }
    }

    /**
     * Validate image file
     * @param file - MultipartFile to validate
     */
    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }

        // Check if file is actually an image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("File must be an image");
        }

        // Check MIME type
        if (!ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException(
                    "Invalid image format. Allowed formats: JPG, JPEG, PNG, WebP"
            );
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new BadRequestException("Invalid file name");
        }

        String fileExtension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_FORMATS.contains(fileExtension)) {
            throw new BadRequestException(
                    "Invalid image format. Allowed formats: JPG, JPEG, PNG, WebP"
            );
        }

        // Check file size (max 2 MB)
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException(
                    String.format("Image size exceeds maximum limit of 2 MB. Your file size: %.2f MB",
                            file.getSize() / (1024.0 * 1024.0))
            );
        }

        log.info("Image validation passed for file: {}", originalFilename);
    }

    /**
     * Get file extension from filename
     * @param filename - Original filename
     * @return File extension
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex + 1);
        }
        return "";
    }

    /**
     * Validate multiple images
     * @param files - List of MultipartFile images
     */
    public void validateMultipleImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("At least one image is required");
        }

        if (files.size() > 5) {
            throw new BadRequestException("Maximum 5 images allowed per upload");
        }

        files.forEach(this::validateImage);
    }
}
