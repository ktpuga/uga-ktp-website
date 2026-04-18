/**
 * File Metadata Model Skeleton
 * Author: Kavin Ramesh
 * 
 * Purpose:
 * This file defines the structure of file metadata that will
 * be stored in Firestore for each uploaded file
 * 
 * Firebase Storage will store the actual file,
 * while Firestore will store this metadata for:
 *  - searching
 *  - filtering
 *  - displaying files
 *  - enforcing access control
 */

/**
 * This is a template for file metadata
 */
export const fileMetadataTemplate = {
    fileName: "",        // Display name (e.g., "Resume Book 2025")
    fileURL: "",         // Firebase Storage download URL
    fileType: "",        // File extension (pdf, png, jpg, etc.)
    fileSize: 0,         // Size in bytes
    folderPath: "",      // Storage path (e.g., /alumni/resumes)
    uploaderID: "",      // User ID of uploader
    uploadDate: null,    // Timestamp
    accessLevel: "",     // public | member | alumni | admin
    tags: [],            // Keywords for searching/filtering
}

/**
 * Creates a metadata object for Firestore
 */
export function createFileMetadata({
    file,
    downloadURL,
    folderPath,
    uploaderID = "",
    accessLevel = "member",
}) {
    return {
        fileName: file.name,
        fileURL: downloadURL,
        fileType: file.name.split(".").pop()?.toLowerCase() || "",
        fileSize: file.size,
        folderPath,
        uploaderID,
        accessLevel,
        tags: [],
    };
}