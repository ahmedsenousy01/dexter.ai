import { generateUploadButton, generateUploadDropzone, generateUploader } from "@uploadthing/react";

import type { MainFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<MainFileRouter>();
export const UploadDropzone = generateUploadDropzone<MainFileRouter>();
export const Uploader = generateUploader<MainFileRouter>();
