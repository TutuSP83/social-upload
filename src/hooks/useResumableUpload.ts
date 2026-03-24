import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'tus-js-client';

interface ResumableParams {
  bucket: string;
  objectName: string;
  file: File;
  accessToken: string;
  cacheControl?: number | string;
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
}

// Derive the resumable endpoint using a constructed public URL
async function getResumableEndpoint(bucket: string): Promise<string> {
  const { data } = supabase.storage.from(bucket).getPublicUrl('__probe__');
  const publicUrl = data.publicUrl;
  const origin = new URL(publicUrl).origin; // e.g. https://<project>.supabase.co
  return `${origin}/storage/v1/upload/resumable`;
}

export async function uploadResumableToSupabase({
  bucket,
  objectName,
  file,
  accessToken,
  cacheControl = 3600,
  onProgress,
}: ResumableParams): Promise<void> {
  const endpoint = await getResumableEndpoint(bucket);

  await new Promise<void>((resolve, reject) => {
    let currentToken = accessToken;
    const refreshId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          currentToken = session.access_token;
        }
      } catch {
        // ignore refresh errors
      }
    }, 60 * 1000);

    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000, 40000, 60000],
      headers: {
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName,
        contentType: file.type || 'application/octet-stream',
        cacheControl: String(cacheControl),
      },
      // Required by Supabase TUS endpoint
      chunkSize: 6 * 1024 * 1024, // 6MB
      onBeforeRequest(req) {
        if (currentToken) {
          req.setHeader('authorization', `Bearer ${currentToken}`);
        }
      },
      onError(error) {
        clearInterval(refreshId);
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        onProgress?.(bytesUploaded, bytesTotal);
      },
      onSuccess() {
        clearInterval(refreshId);
        resolve();
      },
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
}
