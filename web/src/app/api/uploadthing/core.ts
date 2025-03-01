import { type FileRouter, createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/server/auth";

const f = createUploadthing();

export const mainFileRouter = {
  document: f({
    image: { maxFileSize: "4MB" }
  })
    .middleware(async ({}) => {
      const session = await auth();

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!session || !session.user) throw new UploadThingError("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    })
} satisfies FileRouter;

export type MainFileRouter = typeof mainFileRouter;
