'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_FILE_SIZE } from '@/lib/constants';
import Image from 'next/image';

async function convertHeicToJpeg(file: File): Promise<File> {
  // Only convert HEIC/HEIF files
  if (!file.type.includes('heic') && !file.type.includes('heif') && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
    return file;
  }
  const heic2any = (await import('heic2any')).default;
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }) as Blob;
  return new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' });
}

interface PhotoUploaderProps {
  onUpload: (file: File) => void;
  preview: string | null;
  uploading: boolean;
  onClear: () => void;
}

export function PhotoUploader({ onUpload, preview, uploading, onClear }: PhotoUploaderProps) {
  const handleFile = useCallback(async (file: File) => {
    const converted = await convertHeicToJpeg(file);
    onUpload(converted);
  }, [onUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'] },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: uploading,
  });

  if (preview) {
    return (
      <div className="relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-brand-peach/30">
          <Image
            src={preview}
            alt="House photo"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 rounded-full shadow-lg"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8
        aspect-[4/3] cursor-pointer transition-colors
        ${isDragActive ? 'border-brand-orange bg-brand-peach-light' : 'border-brand-peach/40 hover:border-brand-orange hover:bg-brand-peach-light'}
        ${uploading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          <p className="text-sm text-brand-brown/50">Uploading photo...</p>
        </>
      ) : (
        <>
          <div className="flex gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-peach-light">
              <Camera className="h-7 w-7 text-brand-orange" />
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-peach-light">
              <Upload className="h-7 w-7 text-brand-brown/60" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop photo here' : 'Upload house photo'}
            </p>
            <p className="mt-1 text-sm text-brand-brown/50">
              Take a photo or drag & drop. JPEG, PNG, or WebP up to 20MB.
            </p>
          </div>
          {/* Hidden camera input for mobile */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            id="camera-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('camera-input')?.click();
            }}
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
        </>
      )}
    </div>
  );
}
