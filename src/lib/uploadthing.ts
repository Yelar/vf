import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Background video uploader - simplified and hardened
  backgroundVideoUploader: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        const session = await auth();
        if (!session?.user?.email || session.user.email !== 'elarysertaj@gmail.com') {
          throw new Error("Unauthorized - Admin access required");
        }
        return { userId: session.user.id };
      } catch (error) {
        console.error("Video upload middleware error:", error);
        throw new Error("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Video upload complete:", { metadata, file });
        // Return data in the format expected by the client
        return { 
          url: file.ufsUrl,
          key: file.key,
          name: file.name,
          size: file.size
        };
      } catch (error) {
        console.error("Video upload callback error:", error);
        throw error; // Let UploadThing handle the error
      }
    }),

  // Background music uploader - simplified and hardened
  backgroundMusicUploader: f({ audio: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        const session = await auth();
        if (!session?.user?.email || session.user.email !== 'elarysertaj@gmail.com') {
          throw new Error("Unauthorized - Admin access required");
        }
        return { userId: session.user.id };
      } catch (error) {
        console.error("Music upload middleware error:", error);
        throw new Error("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Music upload complete:", { metadata, file });
        // Return data in the format expected by the client
        return { 
          url: file.ufsUrl,
          key: file.key,
          name: file.name,
          size: file.size
        };
      } catch (error) {
        console.error("Music upload callback error:", error);
        throw error; // Let UploadThing handle the error
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;