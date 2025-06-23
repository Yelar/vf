import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  videoUploader: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session?.user) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id, userEmail: session.user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File size:", file.size);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        key: file.key,
        size: file.size,
        name: file.name
      };
    }),
  
  // File uploader for quiz content (PDFs, text files, images, etc.)
  quizContentUploader: f({ 
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    text: { maxFileSize: "16MB", maxFileCount: 5 },
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    blob: { maxFileSize: "32MB", maxFileCount: 5 }
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id, userEmail: session.user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('\n🎉 === QUIZ FILE UPLOAD COMPLETE ===');
      console.log("👤 User ID:", metadata.userId);
      console.log("📧 User Email:", metadata.userEmail);
      console.log("📄 File Name:", file.name);
      console.log("🔗 File URL:", file.url);
      console.log("📏 File Size:", file.size);
      console.log("📋 File Type:", file.type);
      console.log("🗝️ File Key:", file.key);
      console.log('✅ Upload callback successful');

      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        key: file.key,
        size: file.size,
        name: file.name,
        type: file.type
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 