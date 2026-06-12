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
    `${API_URL}/api/presign`,
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

  return  key;
}


export async function listS3Files() {
  const { data } = await axios.get<{ files: S3File[] }>(
    `${API_URL}/api/uploads`  
  );
  console.log(data)
  return data.files;
}

export async function getDownloadUrl(key: string) {
  const { data } = await axios.get<{ url: string }>(
    `${API_URL}/api/download`,
    { params: { key } }
  );
  return data.url;
}

export async function deleteS3File(key: string) {
  const { data } = await axios.delete<{ key: string; deleted: boolean }>(
    `${API_URL}/api/delete`,
    { params: { key } }
  );
  return data;
}