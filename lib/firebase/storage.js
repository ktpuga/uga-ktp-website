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

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(file, folderPath, user) {
    console.log("uploadFile (not implemented)", { file, folderPath, user });
    return {
        success: false,
        downloadURL: "",
        storagePath: "",
    };
}

/**
 * Delete a file from Firebase Storage
 * @param {string} storagePath - The path in Firebase Storage where the file is stored
 */
export async function deleteFile(storagePath) {
    console.log("deleteFile (not implemented)", { storagePath });
    return false;

}

/**
 * In the future list file in a folder
 * 
 */
export async function listFIles(folderPath) {
    console.log("listFiles (not implemented)", { folderPath });
}
