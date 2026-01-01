'use client';

import { useState } from 'react';
import type { GalleryDisplayMode, GridSpan } from './index';

export interface GalleryClientProps {
  images: string[];
  displayMode?: GalleryDisplayMode;
  columns?: number;
  gridSpans?: GridSpan[];
}

export function GalleryClient({
  images,
  displayMode = 'grid',
  columns = 3,
  gridSpans = [],
}: GalleryClientProps) {
  const getSpan = (index: number): GridSpan => {
    return gridSpans[index] || { col: 1, row: 1 };
  };
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    // In view mode, don't show anything when empty
    return null;
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={`gallery gallery-${displayMode}`}>
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
            <img
              src={images[currentIndex]}
              alt={`Gallery image ${currentIndex + 1}`}
              className="gallery-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
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
      ) : displayMode === 'grid' ? (
        <div
          className="gallery-grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
          }}
        >
          {images.map((url, index) => {
            const span = getSpan(index);
            return (
              <div
                key={index}
                className="gallery-grid-item"
                style={{
                  gridColumn: `span ${span.col}`,
                  gridRow: `span ${span.row}`,
                }}
              >
                <img
                  src={url}
                  alt={`Gallery image ${index + 1}`}
                  className="gallery-image"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="gallery-list">
          {images.map((url, index) => (
            <div key={index} className="gallery-list-item">
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="gallery-image"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
