import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type PresignResponse = {
  url: string;
  fields: Record<string, string>;
  key: string;
};
export type S3File = {
  key: string;
  size: number;
  lastModified?: string;
};

export async function getPresignedUpload(fileName: string, folder?: string) {
  const { data } = await axios.post<PresignResponse>(
    `${API_URL}/api/uploads/presign`,
    { fileName, folder }
  );
  return data;
}

export async function uploadFileToS3(file: File, folder = "uploads") {
  const { url, fields, key } = await getPresignedUpload(file.name, folder);

  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  formData.append("file", file);

  await axios.post(url, formData);

  return { key, fileName: file.name };
}


export async function listS3Files() {
  const { data } = await axios.get<{ files: S3File[] }>(
    `${API_URL}/api/uploads`  
  );
  return data.files;
}

export async function getDownloadUrl(key: string) {
  const { data } = await axios.get<{ url: string }>(
    `${API_URL}/api/uploads/download`,
    { params: { key } }
  );
  return data.url;
}

export async function deleteS3File(key: string) {
  const { data } = await axios.delete<{ key: string; deleted: boolean }>(
    `${API_URL}/api/uploads`,
    { params: { key } }
  );
  return data;
}