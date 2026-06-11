"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { uploadFileToS3 } from "@/lib/s3-upload";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [uploadedKeys, setUploadedKeys] = useState<string[]>([]);

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    setFiles(Array.from(selected));
    setStatus("");
  }

  async function handleUpload() {
    if (!files.length) {
      setStatus("Please select at least one file.");
      return;
    }

    setUploading(true);
    setStatus(`Uploading ${files.length} file(s)...`);

    const successKeys: string[] = [];

    try {
      for (const file of files) {
        const result = await uploadFileToS3(file);
        successKeys.push(result.key);
      }

      setUploadedKeys((prev) => [...successKeys, ...prev]);
      setStatus(`Uploaded ${successKeys.length} file(s) successfully.`);
      setFiles([]);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setStatus(error.response?.data?.error || error.message);
      } else {
        setStatus("Upload failed. Check API and AWS config.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-zinc-900">Upload to S3</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select files and upload them to your bucket.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 px-4 py-10 text-center transition hover:border-zinc-400 hover:bg-zinc-50">
        <span className="text-sm font-medium text-zinc-800">Choose files</span>
        <span className="mt-1 text-xs text-zinc-500">You can select multiple files</span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {files.length > 0 && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-800">
            Selected ({files.length})
          </p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-zinc-600">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="truncate">
                • {file.name} ({formatSize(file.size)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload to S3"}
      </button>

      {status && (
        <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          {status}
        </p>
      )}

      {uploadedKeys.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-800">Uploaded to S3</h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            {uploadedKeys.map((key) => (
              <li key={key} className="truncate">
                • {key}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}