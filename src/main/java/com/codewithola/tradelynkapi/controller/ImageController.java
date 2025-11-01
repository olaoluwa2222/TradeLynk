package com.codewithola.tradelynkapi.controller;


import com.cloudinary.Cloudinary;
import com.codewithola.tradelynkapi.security.UserPrincipal;
import com.codewithola.tradelynkapi.services.ImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private final ImageService imageService;
    private final Cloudinary cloudinary;


    /**
     * POST /api/images/upload
     * Upload a single image to Cloudinary (authenticated)
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("image") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/v1/images/upload - User: {} uploading image: {}",
                userPrincipal.getEmail(), file.getOriginalFilename());

        Map<String, String> uploadResult = imageService.uploadImage(file);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Image uploaded successfully");
        response.put("data", uploadResult);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    /**
     * POST /api/images/upload-multiple
     * Upload multiple images to Cloudinary (authenticated)
     * Maximum 5 images per request
     */
    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadMultipleImages(
            @RequestParam("images") List<MultipartFile> files,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("POST /api/v1/images/upload-multiple - User: {} uploading {} images",
                userPrincipal.getEmail(), files.size());

        List<Map<String, String>> uploadResults = imageService.uploadMultipleImages(files);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", String.format("%d image(s) uploaded successfully", uploadResults.size()));
        response.put("data", uploadResults);
        response.put("count", uploadResults.size());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * DELETE /api/images
     * Delete an image from Cloudinary (authenticated)
     */
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteImage(
            @RequestParam("publicId") String publicId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("DELETE /api/v1//images - User: {} deleting image with publicId: {}",
                userPrincipal.getEmail(), publicId);

        imageService.deleteImage(publicId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Image deleted successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/images/multiple
     * Delete multiple images from Cloudinary (authenticated)
     */
    @DeleteMapping("/multiple")
    public ResponseEntity<Map<String, Object>> deleteMultipleImages(
            @RequestBody Map<String, List<String>> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<String> publicIds = request.get("publicIds");

        log.info("DELETE /api/v1/images/multiple - User: {} deleting {} images",
                userPrincipal.getEmail(), publicIds.size());

        imageService.deleteMultipleImages(publicIds);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", String.format("%d image(s) deleted successfully", publicIds.size()));

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/images/extract-public-id
     * Extract public ID from Cloudinary URL
     */
    @PostMapping("/extract-public-id")
    public ResponseEntity<Map<String, Object>> extractPublicId(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String url = request.get("url");
        log.info("POST /api/v1/images/extract-public-id - Extracting public ID from URL");

        String publicId = imageService.extractPublicIdFromUrl(url);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", Map.of("publicId", publicId != null ? publicId : ""));

        return ResponseEntity.ok(response);
    }
}
