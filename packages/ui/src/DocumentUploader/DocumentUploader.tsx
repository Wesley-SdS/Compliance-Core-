'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface DocumentUploaderProps {
  categories: string[];
  /** The parent should convert expiresAt (string from date input) to Date if needed. */
  onUpload: (file: File, metadata: { category: string; expiresAt?: string }) => Promise<void>;
  maxSize?: number; // MB
  acceptedTypes?: string[];
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({
  categories,
  onUpload,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
  className,
}: DocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      const maxBytes = maxSize * 1024 * 1024;
      if (file.size > maxBytes) {
        return `Arquivo excede o limite de ${maxSize}MB (${formatFileSize(file.size)})`;
      }
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(ext)) {
        return `Tipo de arquivo não aceito. Tipos permitidos: ${acceptedTypes.join(', ')}`;
      }
      return null;
    },
    [maxSize, acceptedTypes]
  );

  function handleFileSelect(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  const handleUpload = async () => {
    if (!selectedFile || !category) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(selectedFile, { category, expiresAt: expiresAt || undefined });
      if (!mountedRef.current) return;
      // Success - reset form
      setSelectedFile(null);
      setCategory('');
      setExpiresAt('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo');
    } finally {
      if (mountedRef.current) {
        setUploading(false);
      }
    }
  };

  function handleRemoveFile() {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const canUpload = selectedFile && category && !uploading;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 520,
      }}
    >
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        style={{
          border: `2px dashed ${isDragOver ? '#3B82F6' : error ? '#FCA5A5' : '#D1D5DB'}`,
          borderRadius: 8,
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragOver ? '#EFF6FF' : '#FAFAFA',
          transition: 'all 0.15s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83D\uDCC1'}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          Arraste e solte o arquivo aqui
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          ou clique para selecionar — Máx. {maxSize}MB
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            fontSize: 13,
            color: '#DC2626',
            backgroundColor: '#FEF2F2',
            padding: '8px 12px',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{'\uD83D\uDCC4'}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0C4A6E' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: 11, color: '#0369A1' }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFile();
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: 16,
              padding: '2px 6px',
            }}
          >
            {'\u2715'}
          </button>
        </div>
      )}

      {/* Category selector */}
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
            marginBottom: 4,
            display: 'block',
          }}
        >
          Categoria *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: 13,
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            color: category ? '#111827' : '#9CA3AF',
            boxSizing: 'border-box',
          }}
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Expiry date (optional) */}
      <div>
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#374151',
            marginBottom: 4,
            display: 'block',
          }}
        >
          Data de validade (opcional)
        </label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: 13,
            border: '1px solid #D1D5DB',
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Upload progress - indeterminate */}
      {uploading && (
        <div>
          <div
            style={{
              height: 6,
              backgroundColor: '#E5E7EB',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                height: '100%',
                width: '40%',
                backgroundColor: '#3B82F6',
                borderRadius: 3,
                animation: 'cc-indeterminate 1.4s ease-in-out infinite',
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
            Enviando...
          </div>
          <style>{`
            @keyframes cc-indeterminate {
              0% { left: -40%; }
              100% { left: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!canUpload}
        style={{
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          backgroundColor: canUpload ? '#3B82F6' : '#9CA3AF',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 6,
          cursor: canUpload ? 'pointer' : 'not-allowed',
          opacity: canUpload ? 1 : 0.7,
          width: '100%',
        }}
      >
        {uploading ? 'Enviando...' : 'Enviar documento'}
      </button>
    </div>
  );
}
