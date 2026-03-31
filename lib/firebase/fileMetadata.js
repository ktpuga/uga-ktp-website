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
 * This create a new metadata object from a file upload
 */
export function createFileMetadata({
    file,
    downloadURL,
    folderPath,
    uploaderID,
    accessLevel,
}) {
    // replace data with firebase timestamp if needed
    console.log("createFileMetadata (not implemented fully)");
    return {
        fileName: file?.name || "",
        fileURL: downloadURL || "",
        fileType: file?.type || "",
        fileSize: file?.size || 0,
        folderPath: folderPath || "",
        uploaderID: uploaderID || "",
        uploadDate: new Date(), // placeholder
        accessLevel: accessLevel || "member",
        tags: [],
    };
}