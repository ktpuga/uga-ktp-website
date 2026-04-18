/**
 * Firestore metadata service
 * Author: Kavin Ramesh
 *
 * Purpose:
 * Stores and retrieves file metadata in Firestore.
 */

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

const filesCollection = collection(db, "files");

export async function saveFileMetadata(metadata) {
    try {
        const docRef = await addDoc(filesCollection, {
            ...metadata,
            uploadDate: serverTimestamp(),
        });

        return {
            success: true,
            docId: docRef.id,
        };
    } catch (error) {
        console.error("Error saving metadata:", error);
        return {
            success: false,
            docId: "",
            error,
        };
    }
}

export async function getFilesByFolder(folderPath) {
    try {
        const q = query(filesCollection, where("folderPath", "==", folderPath));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error getting files by folder:", error);
        return [];
    }
}