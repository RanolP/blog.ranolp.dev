'use client';

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import '@uppy/core/css/style.css';
import type { GalleryDisplayMode } from './index';

const IMAGE_ERROR_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = IMAGE_ERROR_PLACEHOLDER;
};

export function GalleryNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const images = (node.attrs.images as string[]) || [];
  const displayMode = (node.attrs.displayMode as GalleryDisplayMode) || 'grid';
  const columns = (node.attrs.columns as number) || 3;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<{
    progress: number;
    fileName: string | null;
  }>({ progress: 0, fileName: null });

  const uploadZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use ref to avoid stale closure in Uppy callbacks
  const imagesRef = useRef<string[]>(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const updateAttributesRef = useRef(updateAttributes);
  useEffect(() => {
    updateAttributesRef.current = updateAttributes;
  }, [updateAttributes]);

  // Initialize Uppy instance
  const [uppy] = useState(() => {
    const instance = new Uppy({
      restrictions: { allowedFileTypes: ['image/*'] },
      autoProceed: true,
    });

    instance.use(XHRUpload, {
      endpoint: '/api/upload',
      fieldName: 'file',
      formData: true,
    });

    instance.on('upload-progress', (file, progress) => {
      if (file && progress) {
        setUploadProgress({
          progress: progress.percentage || 0,
          fileName: file.name || null,
        });
      }
    });

    instance.on('upload-success', (file, response) => {
      if (file && response?.body?.url) {
        // Always append to existing images - use ref to get fresh value
        const currentImages = imagesRef.current;
        updateAttributesRef.current({ images: [...currentImages, response.body.url] });
        instance.removeFile(file.id);
      }
      setUploadProgress({ progress: 0, fileName: null });
    });

    instance.on('upload-error', (file, error) => {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
      if (file) instance.removeFile(file.id);
      setUploadProgress({ progress: 0, fileName: null });
    });

    return instance;
  });

  // Drag-drop handlers (active for both empty and non-empty galleries)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZoneRef.current?.classList.add('is-drag-over');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadZoneRef.current?.classList.remove('is-drag-over');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZoneRef.current?.classList.remove('is-drag-over');

      const files = Array.from(e.dataTransfer?.files || []);
      files
        .filter((file) => file.type.startsWith('image/'))
        .forEach((file) => {
          uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
            source: 'Local',
            isRemote: false,
          });
        });
    },
    [uppy, updateAttributes],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      uppy.cancelAll();
      uppy.getFiles().forEach((file) => uppy.removeFile(file.id));
    };
  }, [uppy]);

  // Handlers
  const handleAddImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
          source: 'Local',
          isRemote: false,
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uppy],
  );

  const handleRemoveImage = useCallback(
    async (index: number) => {
      const imageUrl = images[index];

      // Delete from server
      try {
        const formData = new FormData();
        formData.append('url', imageUrl);
        await fetch('/api/delete', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.error('Failed to delete image from server:', error);
        // Continue with client-side removal even if server deletion fails
      }

      // Remove from client gallery
      const newImages = images.filter((_, i) => i !== index);
      updateAttributes({ images: newImages });
      if (currentIndex >= newImages.length && newImages.length > 0) {
        setCurrentIndex(newImages.length - 1);
      }
    },
    [images, currentIndex, updateAttributes],
  );

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleDisplayModeChange = useCallback(
    (mode: GalleryDisplayMode) => {
      updateAttributes({ displayMode: mode });
    },
    [updateAttributes],
  );

  const handleColumnsChange = useCallback(
    (newColumns: number) => {
      updateAttributes({ columns: Math.max(1, Math.min(6, newColumns)) });
    },
    [updateAttributes],
  );

  // Render unified image component with delete overlay
  const renderGalleryImage = (url: string, index: number) => (
    <div className="gallery-image-wrapper">
      <img
        src={url}
        alt={`Gallery image ${index + 1}`}
        className="gallery-image"
        onError={handleImageError}
      />
      {selected && (
        <button
          type="button"
          onClick={() => handleRemoveImage(index)}
          className="gallery-delete-overlay"
          aria-label="Delete image"
        >
          ×
        </button>
      )}
    </div>
  );

  if (images.length === 0) {
    return (
      <NodeViewWrapper as="div" className="gallery gallery-empty">
        <div
          ref={uploadZoneRef}
          className="gallery-upload-zone gallery-empty-upload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="gallery-empty-content">
            <p>No images in gallery</p>
            <button
              type="button"
              onClick={handleAddImage}
              className="gallery-add-button"
            >
              Add Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        {uploadProgress.progress > 0 && (
          <div className="gallery-upload-status">
            <div className="gallery-upload-status-bar">
              <div
                className="gallery-upload-progress"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            <div className="gallery-upload-status-text">
              Uploading {uploadProgress.fileName}...{' '}
              {Math.round(uploadProgress.progress)}%
            </div>
          </div>
        )}
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="div" className="gallery gallery-editor">
      <div
        ref={uploadZoneRef}
        className="gallery-upload-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`gallery-content gallery-${displayMode}`}>
          {displayMode === 'carousel' ? (
            <div className="gallery-carousel-container">
              <button
                type="button"
                onClick={prevImage}
                className="gallery-carousel-nav gallery-carousel-prev"
                aria-label="Previous image"
              >
                ‹
              </button>
              <div className="gallery-carousel-image-wrapper">
                {renderGalleryImage(images[currentIndex], currentIndex)}
                <div className="gallery-carousel-indicator">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>
              <button
                type="button"
                onClick={nextImage}
                className="gallery-carousel-nav gallery-carousel-next"
                aria-label="Next image"
              >
                ›
              </button>
            </div>
          ) : displayMode === 'masonry' ? (
            <div className="gallery-masonry" style={{ columnCount: columns }}>
              {images.map((url, index) => (
                <div key={index} className="gallery-masonry-item">
                  {renderGalleryImage(url, index)}
                </div>
              ))}
            </div>
          ) : displayMode === 'grid' ? (
            <div
              className="gallery-grid"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {images.map((url, index) => (
                <div key={index} className="gallery-grid-item">
                  {renderGalleryImage(url, index)}
                </div>
              ))}
            </div>
          ) : (
            <div className="gallery-list">
              {images.map((url, index) => (
                <div key={index} className="gallery-list-item">
                  {renderGalleryImage(url, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {uploadProgress.progress > 0 && (
        <div className="gallery-upload-indicator">
          <div className="gallery-upload-indicator-bar">
            <div
              className="gallery-upload-indicator-progress"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
          <div className="gallery-upload-indicator-text">
            {uploadProgress.fileName} ({Math.round(uploadProgress.progress)}%)
          </div>
        </div>
      )}
      {selected && (
        <div className="gallery-controls">
          <div className="gallery-control-group">
            <label>Display Mode:</label>
            <select
              value={displayMode}
              onChange={(e) =>
                handleDisplayModeChange(e.target.value as GalleryDisplayMode)
              }
              className="gallery-select"
            >
              <option value="carousel">Carousel</option>
              <option value="masonry">Masonry</option>
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
          {(displayMode === 'masonry' || displayMode === 'grid') && (
            <div className="gallery-control-group">
              <label>Columns:</label>
              <input
                type="number"
                min="1"
                max="6"
                value={columns}
                onChange={(e) =>
                  handleColumnsChange(parseInt(e.target.value, 10))
                }
                className="gallery-input"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleAddImage}
            className="gallery-add-button"
          >
            Add Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}
