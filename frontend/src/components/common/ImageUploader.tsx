import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, RefreshCw, Loader2 } from 'lucide-react';
import { uploadMenuImageViaApi, uploadRestaurantImageViaApi, resolveMediaUrl } from '../../services/api';

interface ImageUploaderProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  aspectRatio?: 'square' | 'cover' | 'banner';
  uploadType?: 'menu' | 'restaurant';
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'square',
  uploadType = 'menu',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const uploadFn = uploadType === 'restaurant' ? uploadRestaurantImageViaApi : uploadMenuImageViaApi;
      const uploadedUrl = await uploadFn(file);
      onChange(uploadedUrl);
    } catch (err) {
      console.warn('[ImageUploader] Backend file upload fallback to Data URL', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const aspectClasses = {
    square: 'aspect-square max-w-[180px]',
    cover: 'aspect-[16/9] w-full',
    banner: 'aspect-[21/9] w-full',
  }[aspectRatio];

  const resolvedSrc = resolveMediaUrl(value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</label>}
      {value ? (
        <div className={`relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 ${aspectClasses}`}>
          <img src={resolvedSrc} alt="Uploaded preview" className="w-full h-full object-cover" />
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-amber-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition"
              title="Replace image"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 hover:bg-zinc-900/80 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center ${aspectClasses}`}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin mb-2" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-400 mb-2">
              <Upload className="w-5 h-5" />
            </div>
          )}
          <p className="text-xs font-medium text-zinc-300">
            {isUploading ? 'Uploading image...' : <>Drag & drop or <span className="text-amber-400 underline">browse</span></>}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
