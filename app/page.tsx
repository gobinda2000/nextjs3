'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type MediaFilter = 'all' | 'image' | 'video';

type MediaItem = {
  id: string;
  type: 'image' | 'video';
  src: string;
  poster?: string;
  title: string;
  width?: number;
  height?: number;
};

const FILTER_OPTIONS: Array<{ label: string; value: MediaFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Videos', value: 'video' },
];

export default function SimpleGallery() {
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<Partial<Record<MediaFilter, MediaItem[]>>>({});

  // Lightbox state
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    const cached = cacheRef.current[filter];

    if (cached) {
      setItems(cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/media${filter === 'all' ? '' : `?type=${filter}`}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load media');
        return res.json();
      })
      .then((data: MediaItem[]) => {
        cacheRef.current[filter] = data;
        setItems(data);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== 'AbortError') {
          console.error(err);
          setItems([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filter]);

  // prevent background scroll while modal open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected]);

  // close on Escape
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openItem = useCallback((item: MediaItem) => {
    setSelected(item);
  }, []);

  const closeModal = useCallback(() => setSelected(null), []);

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">Simple Gallery</h1>
          <p className="text-gray-400">Images and Videos Collection</p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-8 flex justify-center gap-4">
          {FILTER_OPTIONS.map((option) => {
            const isActive = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-lg px-6 py-2 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isActive
                    ? 'bg-blue-600 text-white focus-visible:outline-blue-300'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 focus-visible:outline-gray-300'
                }`}
                aria-pressed={isActive}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-20 text-center text-gray-400" role="status">
            <div className="mx-auto inline-flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white/60" />
              <span>Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Gallery Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => openItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') openItem(item);
                  }}
                  className="group cursor-pointer overflow-hidden rounded-xl bg-gray-800 shadow-lg transition hover:scale-105 focus:outline-none"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {item.type === 'image' ? (
                      <Image
                        src={item.src}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        priority={index < 2}
                      />
                    ) : (
                      <video
                        src={item.src}
                        poster={item.poster}
                        className="h-full w-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium uppercase backdrop-blur">
                      {item.type}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {items.length === 0 && (
              <div className="py-20 text-center text-gray-500">No items found</div>
            )}
          </>
        )}
      </div>

      {/* Lightbox / Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeModal}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-md bg-black/50 p-2 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {selected.type === 'image' ? (
              <div className="relative flex h-full min-h-[40vh] w-full items-center justify-center bg-black">
                <Image
                  src={selected.src}
                  alt={selected.title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <video
                src={selected.src}
                poster={selected.poster}
                controls
                autoPlay
                className="h-full w-full bg-black"
                style={{ maxHeight: '90vh' }}
              />
            )}

            <div className="absolute left-4 bottom-4 z-10 rounded-md bg-black/50 px-3 py-1 text-sm">
              {selected.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
