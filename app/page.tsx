'use client';
import { useEffect, useState, useCallback } from 'react';

type MediaItem = {
  id: number;
  type: 'image' | 'video';
  src: string;
  poster?: string;
  title: string;
};

export default function SimpleGallery() {
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox state
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/media${filter === 'all' ? '' : `?type=${filter}`}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: MediaItem[]) => setItems(data))
      .catch((err) => {
        if ((err as any).name !== 'AbortError') {
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
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
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-6 py-2 font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`rounded-lg px-6 py-2 font-medium transition ${
              filter === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`rounded-lg px-6 py-2 font-medium transition ${
              filter === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Videos
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <div className="mx-auto inline-flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white/60" />
              <span>Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Gallery Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') openItem(item);
                  }}
                  className="group cursor-pointer overflow-hidden rounded-xl bg-gray-800 shadow-lg transition hover:scale-105 focus:outline-none"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {item.type === 'image' ? (
                      <img
                        src={item.src}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.src}
                        poster={item.poster}
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
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
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-black"
            onClick={(e) => e.stopPropagation()}
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
              <img
                src={selected.src}
                alt={selected.title}
                className="h-full w-full object-contain bg-black"
                style={{ maxHeight: '90vh' }}
              />
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
