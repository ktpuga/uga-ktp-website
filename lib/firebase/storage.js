/**
 * Firebase Storage configuration and initialization
 * Author: Kavin Ramesh
 *
 * Purpose:
 * This file will handle all interactions with Firebase Storage,
 * including uploading, retrieving, and deleting files.
 * 
 * Will work with Firestore to store file metadata like:
 * - File name
 * - File size
 * - File type
 * - User ID (who uploaded the file)
 */


import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(file, folderPath) {
    try {
        // Create unique file path
        const storagePath = `${folderPath}/${Date.now()}-${file.name}`;

        // Create reference
        const fileRef = ref(storage, storagePath);

        // Upload file
        await uploadBytes(fileRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(fileRef);

        return {
            success: true,
            downloadURL,
            storagePath,
        };
    } catch (error) {
        console.error("Upload error:", error);

        return {
            success: false,
            downloadURL: "",
            storagePath: "",
            error,
        };
    }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(storagePath) {
    try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
        return true;
    } catch (error) {
        console.error("Delete error:", error);
        return false;
    }
}