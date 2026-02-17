import React, { useState, useRef } from 'react';

// Helper para leer cookies
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

interface ImageUploadProps {
  onImageUpload: (url: string, publicId: string) => void;
  adminKey?: string;
  label?: string;
}

export default function ImageUpload({ onImageUpload, adminKey: propAdminKey, label = 'Subir Imagen' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Mostrar preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Cloudinary
      const formData = new FormData();
      formData.append('file', file);

      const adminKey = propAdminKey || getCookie('admin_token') || '';
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-admin-key': adminKey,
        },
        body: formData,
      });

      if (response.status === 401) {
        setError('Sesión expirada. Por favor, vuelve a iniciar sesión.');
        throw new Error('No autorizado');
      }

      if (!response.ok) {
        // Intentar parsear como JSON, si falla mostrar texto plano
        const text = await response.text();
        let errorMsg = 'Error al subir imagen';
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || errorMsg;
        } catch {
          errorMsg = text.substring(0, 200) || `Error ${response.status}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.success) {
        onImageUpload(data.url, data.publicId);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-arena-light rounded-lg p-6 hover:border-arena transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="image-input"
        />
        
        <label
          htmlFor="image-input"
          className={`flex flex-col items-center justify-center cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="w-12 h-12 text-arena mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          
          <p className="text-arena font-semibold text-center">
            {uploading ? 'Subiendo...' : label}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            O arrastra una imagen aquí
          </p>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {preview && (
        <div className="relative w-full max-w-sm">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg border border-arena-light"
          />
          <p className="text-sm text-gray-500 mt-2 text-center">
            {uploading ? 'Subiendo a Cloudinary...' : 'Vista previa'}
          </p>
        </div>
      )}
    </div>
  );
}
