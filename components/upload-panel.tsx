"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { deleteS3File, getDownloadUrl, listS3Files, S3File, uploadFileToS3 } from "@/lib/s3";


function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<S3File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [status, setStatus] = useState("");

  async function loadFiles() {
    setLoadingFiles(true);
    try {
      const data = await listS3Files();
      setFiles(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setStatus(error.response?.data?.error || error.message);
      } else {
        setStatus("Failed to load files.");
      }
    } finally {
      setLoadingFiles(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  function handleFileChange(selected: FileList | null) {
    if (!selected?.[0]) return;
    setFile(selected[0]);
    setStatus("");
  }

  async function handleUpload() {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    setUploading(true);
    setStatus(`Uploading ${file.name}...`);

    try {
      const key = await uploadFileToS3(file);
      setStatus(`Uploaded successfully: ${key}`);
      setFile(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      await loadFiles();
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

  async function handleDownload(key: string) {
    try {
      const url = await getDownloadUrl(key);
      window.open(url, "_blank");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setStatus(error.response?.data?.error || error.message);
      } else {
        setStatus("Download failed.");
      }
    }
  }

  async function handleDelete(key: string) {
    if (!confirm(`Delete "${key}" from S3?`)) return;

    try {
      await deleteS3File(key);
      setStatus(`Deleted: ${key}`);
      await loadFiles();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setStatus(error.response?.data?.error || error.message);
      } else {
        setStatus("Delete failed.");
      }
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Upload section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-900">Upload to S3</h2>
          <p className="mt-1 text-sm text-zinc-500">
            File goes directly to bucket
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 px-4 py-10 text-center transition hover:border-zinc-400 hover:bg-zinc-50">
          <span className="text-sm font-medium text-zinc-800">Choose a file</span>
          <span className="mt-1 text-xs text-zinc-500">One file at a time</span>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </label>

        {file && (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-800">Selected file</p>
            <p className="mt-2 truncate text-sm text-zinc-600">
              {file.name} ({formatSize(file.size)})
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload to S3"}
        </button>

        {status && (
          <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
            {status}
          </p>
        )}
      </div>

      {/* Files list section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Files in S3</h2>
          <button
            type="button"
            onClick={loadFiles}
            disabled={loadingFiles}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>

        {loadingFiles ? (
          <p className="text-sm text-zinc-500">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-zinc-500">No files in bucket yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-800">
                    {item.key}
                  </p>
                  <p className="text-xs text-zinc-500">{formatSize(item.size)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(item.key)}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.key)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}