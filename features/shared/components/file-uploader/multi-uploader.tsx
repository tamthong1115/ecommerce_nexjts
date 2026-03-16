// Multi-file uploader (MAX_FILES = 6)
'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

import Image from 'next/image';
import {
  RenderEmptyState,
  RenderUploadingState,
} from '@/features/shared/components/file-uploader/render-state';

const MAX_FILES = 6;

export type FileItem = {
  url: string;
  publicId: string;
  uploading: boolean;
  progress: number;
  error: boolean;
  isDeleting: boolean;
};

type UploaderProps = {
  value?: { url: string; publicId: string }[];
  onChange?: (files: { url: string; publicId: string }[]) => void;
  maxFiles?: number;
};

export function MultiUploader({
  value = [],
  onChange,
  maxFiles = MAX_FILES,
}: UploaderProps) {
  const [files, setFiles] = useState<FileItem[]>(
    value.map((v) => ({
      url: v.url,
      publicId: v.publicId,
      uploading: false,
      progress: 100,
      error: false,
      isDeleting: false,
    }))
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const notify = (updated: FileItem[]) => {
    setFiles(updated);
    if (onChange)
      onChange(
        updated
          .filter((f) => f.url && f.publicId)
          .map((f) => ({ url: f.url, publicId: f.publicId }))
      );
  };

  const uploadFile = useCallback(
    (file: File) => {
      const temp: FileItem = {
        url: '',
        publicId: '',
        uploading: true,
        progress: 0,
        error: false,
        isDeleting: false,
      };

      notify([...files, temp]);

      const form = new FormData();
      form.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/cloudinary/upload');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          temp.progress = percent;
          notify([...files, temp]);
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          console.log('res:', res);
          if (xhr.status >= 200 && xhr.status < 300 && res.success) {
            temp.url = res.url;
            temp.publicId = res.publicId;
            temp.uploading = false;
            temp.progress = 100;
            notify([...files.filter((f) => f !== temp), temp]);
          } else {
            temp.uploading = false;
            temp.error = true;
            notify([...files.filter((f) => f !== temp), temp]);
          }
        } catch (e) {
          temp.uploading = false;
          temp.error = true;
          notify([...files.filter((f) => f !== temp), temp]);
        }
      };

      xhr.onerror = () => {
        temp.uploading = false;
        temp.error = true;
        notify([...files.filter((f) => f !== temp), temp]);
      };

      xhr.send(form);
    },
    [files, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (files.length >= MAX_FILES) return;
    uploadFile(f);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = async (file: FileItem) => {
    file.isDeleting = true;
    notify([...files]);

    try {
      const res = await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: file.publicId }),
      });
      const json = await res.json();
      if (json.success) {
        notify(files.filter((f) => f !== file));
      } else throw new Error('Delete failed');
    } catch (e) {
      file.isDeleting = false;
      file.error = true;
      notify([...files]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {files.length} / {maxFiles} files
      </div>

      <div className="grid grid-cols-3 gap-4">
        {files.map((file, i) => (
          <div
            key={i}
            className="relative group border rounded overflow-hidden h-32"
          >
            {file.uploading ? (
              <RenderUploadingState
                progress={file.progress}
                file={{} as File}
              />
            ) : file.error ? (
              <div className="p-2 text-red-500 text-center text-sm">Error</div>
            ) : (
              <>
                <Image
                  fill
                  src={file.url}
                  alt={file.publicId}
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ))}

        {files.length < maxFiles && (
          <div
            onClick={() => inputRef.current?.click()}
            className="border border-dashed rounded flex items-center justify-center cursor-pointer h-32"
          >
            <RenderEmptyState isDragActive={false} />
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
