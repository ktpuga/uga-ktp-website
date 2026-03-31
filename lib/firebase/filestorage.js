/**
 * Firestore Metadata Service Skeleton
 * Author: Kavin Ramesh
 * 
 * Purpose:
 * This file handles file metadata that is stored in Firestore.
 * Firestore stores info about each file for organization and display
 * Some metadata fields include:
 * - File name
 * - File size
 * - File type
 * - User ID (who uploaded the file)
 */

// import these helpers when implementing
// import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
// import { db } from "./config";

/**
 * This saves a file's metadata in Firestore
 */
export async function saveFileMetadata(metadata) {
    // Need to connect to Firestore
    // Need to add metadata document and return it
    console.log("saveFileMetadata (not implemented)", metadata);

    return {
        success: false,
        docId: "",
    };
}

/**
 * Get all files from a specific folder
 */
export async function getFilesByFolder(folderPath) {
    // Need to connect to Firestore
    // Need to query files by folderPath
    console.log("getFilesByFolder (not implemented)", folderPath);

    return [];
}

/**
 * Get files by a access level
 */
export async function getFilesByAccessLevel(accessLevel) {
    // Need to connect to Firestore
    // Need to query files by accessLevel
    console.log("getFilesByAccessLevel (not implemented)", accessLevel);

    return [];
}

/**
 * Delete a file's metadata from Firestore
 */
export async function deleteFileMetadata(docId) {
    // Need to connect to Firestore
    // Need to delete metadata document by docId
    console.log("deleteFileMetadata (not implemented)", docId);

    return false;
}


