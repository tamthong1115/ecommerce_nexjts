'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

import Image from 'next/image';
import {
  RenderEmptyState,
  RenderUploadingState,
} from '@/features/shared/components/file-uploader/render-state';

export type SingleFile = {
  url: string;
  publicId: string;
  uploading: boolean;
  progress: number;
  error: boolean;
  isDeleting: boolean;
};

type UploaderProps = {
  value?: { url: string; publicId: string } | null;
  onChange?: (file: { url: string; publicId: string } | null) => void;
};

export function Uploader({ value = null, onChange }: UploaderProps) {
  const [file, setFile] = useState<SingleFile | null>(
    value
      ? {
          url: value.url,
          publicId: value.publicId,
          uploading: false,
          progress: 100,
          error: false,
          isDeleting: false,
        }
      : null
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const notify = (updated: SingleFile | null) => {
    setFile(updated);

    if (!onChange) return;
    if (!updated || !updated.url || !updated.publicId) onChange(null);
    else onChange({ url: updated.url, publicId: updated.publicId });
  };

  const uploadFile = useCallback(
    (fileBlob: File) => {
      const temp: SingleFile = {
        url: '',
        publicId: '',
        uploading: true,
        progress: 0,
        error: false,
        isDeleting: false,
      };

      notify(temp);

      const form = new FormData();
      form.append('file', fileBlob);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/cloudinary/upload');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          temp.progress = percent;
          notify({ ...temp });
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);

          if (xhr.status >= 200 && xhr.status < 300 && res.success) {
            notify({
              url: res.url,
              publicId: res.publicId,
              uploading: false,
              progress: 100,
              error: false,
              isDeleting: false,
            });
          } else {
            notify({ ...temp, uploading: false, error: true });
          }
        } catch {
          notify({ ...temp, uploading: false, error: true });
        }
      };

      xhr.onerror = () => {
        notify({ ...temp, uploading: false, error: true });
      };

      xhr.send(form);
    },
    [onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    uploadFile(f);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = async () => {
    if (!file) return;

    notify({ ...file, isDeleting: true });

    try {
      const res = await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: file.publicId }),
      });

      const json = await res.json();

      if (json.success) notify(null);
      else throw new Error('Delete failed');
    } catch {
      notify({ ...file, isDeleting: false, error: true });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {file ? (
          <div className="relative group border rounded overflow-hidden h-32">
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
                  src={file.url}
                  fill
                  className="object-cover"
                  alt={file.publicId}
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ) : (
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
