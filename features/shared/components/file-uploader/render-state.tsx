import { CloudUploadIcon, ImageIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppLoader } from '@/components/ui/loader';

export function RenderEmptyState({ isDragActive }: { isDragActive: boolean }) {
  return (
    <div className="text-center">
      <div className="flex items-center mx-auto justify-center size-12 rounded-full bg-muted mb-4">
        <CloudUploadIcon
          className={cn(
            'size-6 text-muted-foreground',
            isDragActive && 'text-primary'
          )}
        />
      </div>

      <p className="text-base font-semibold text-muted-foreground">
        {isDragActive ? (
          'Drop the files here...'
        ) : (
          <>
            Drag and drop files here, or{' '}
            <span className="text-primary font-bold cursor-pointer">
              click to select files
            </span>
          </>
        )}
      </p>
    </div>
  );
}

export function RenderErrorState() {
  return (
    <div className="text-center">
      <div className="flex items-center mx-auto justify-center size-12 rounded-full bg-destructive/30 mb-4">
        <ImageIcon className={cn('size-6 text-destructive')} />
      </div>

      <p className="text-base font-semibold">Upload Failed</p>
      <p className="text-xs mt-1 text-muted-foreground">Something went wrong</p>
      <p className="text-xl mt-3 text-muted-foreground">
        Click or drag file to retry
      </p>
    </div>
  );
}

export function RenderUploadedState({
  previewUrl,
  isDeleting,
  handleRemoveFile,
}: {
  previewUrl: string;
  isDeleting: boolean;
  handleRemoveFile: () => void;
}) {
  return (
    <div className="w-full h-full relative bg-black/5 flex items-center justify-center">
      {/* use a regular img to avoid remotePatterns issues with next/image */}
      <img
        src={previewUrl}
        alt="Uploaded preview"
        className="object-contain w-full h-full"
      />
      <button
        type="button"
        onClick={handleRemoveFile}
        disabled={isDeleting}
        className="absolute top-3 right-3 inline-flex items-center justify-center p-2 rounded-full bg-destructive text-white"
      >
        {isDeleting ? <AppLoader /> : <XIcon className="size-4" />}
      </button>
    </div>
  );
}

export function RenderUploadingState({
  progress,
  file,
}: {
  progress: number;
  file: File;
}) {
  return (
    <div className="text-center flex justify-center items-center flex-col p-4">
      <p className="text-lg font-semibold">{progress}%</p>
      <p className="mt-2 text-sm font-medium text-foreground">Uploading...</p>
      <p className="mt-1 text-xs text-muted-foreground truncate max-w-xs">
        {file?.name}
      </p>
    </div>
  );
}
// ...existing code...
