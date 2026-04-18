"use client";

import { useEffect, useState } from "react";
import { uploadFile } from "@/lib/firebase/storage";
import { saveFileMetadata, getFilesByFolder } from "@/lib/firebase/firestore";
import { createFileMetadata } from "@/lib/firebase/fileMetadata";

export default function StoragePage() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState([]);

    async function loadFiles() {
        const data = await getFilesByFolder("public");
        setFiles(data);
    }

    useEffect(() => {
        loadFiles();
    }, []);

    const handleUpload = async () => {
        if (!file) {
            setMessage("Select a file first");
            return;
        }

        setMessage("Uploading...");

        const uploadResult = await uploadFile(file, "public");

        if (!uploadResult.success) {
            setMessage("Upload failed");
            return;
        }

        const metadata = createFileMetadata({
            file,
            downloadURL: uploadResult.downloadURL,
            folderPath: "public",
            uploaderID: "test-user",
            accessLevel: "member",
        });

        const firestoreResult = await saveFileMetadata(metadata);

        if (!firestoreResult.success) {
            setMessage("File uploaded, but metadata save failed");
            return;
        }

        setMessage("Upload successful and metadata saved");
        setFile(null);
        await loadFiles();
    };

    return (
        <main className="p-6">
            <h1 className="text-xl mb-4">Storage Test</h1>

            <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button onClick={handleUpload} className="ml-4 border px-3 py-1">
                Upload
            </button>

            <p className="mt-4">{message}</p>

            <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Uploaded Files</h2>

                {files.length === 0 ? (
                    <p>No files uploaded yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {files.map((item) => (
                            <li key={item.id} className="border p-3 rounded">
                                <p><strong>Name:</strong> {item.fileName}</p>
                                <p><strong>Type:</strong> {item.fileType}</p>
                                <p><strong>Access:</strong> {item.accessLevel}</p>
                                <a
                                    href={item.fileURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                >
                                    Open File
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}