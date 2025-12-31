'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type MediaItem = {
  id: string;
  type: 'image' | 'video';
  src: string;
  poster?: string;
  title: string;
  tags?: string[];
};

type MediaFilter = 'all' | 'image' | 'video' | `tag:${string}`;
type FilterOption = { label: string; value: MediaFilter };

const BASE_FILTER_OPTIONS: FilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Videos', value: 'video' },
];

const PAGE_SIZE = 12;

export default function SimpleGallery() {
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [filters, setFilters] = useState<FilterOption[]>(BASE_FILTER_OPTIONS);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const cacheRef = useRef<Record<string, MediaItem[]>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch tags
  useEffect(() => {
    let cancelled = false;
    fetch('/api/media/tags')
      .then((res) => res.ok ? res.json() : [])
      .then((tags: string[]) => {
        if (!cancelled && Array.isArray(tags)) {
          setFilters([
            ...BASE_FILTER_OPTIONS,
            ...tags.map((tag) => ({
              label: tag.trim(),
              value: `tag:${tag.trim()}` as MediaFilter,
            })),
          ]);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Fetch media items
  useEffect(() => {
    if (cacheRef.current[filter]) {
      setItems(cacheRef.current[filter]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const query = filter === 'all' ? '' :
      filter === 'image' || filter === 'video' ? `?type=${filter}` :
      `?tag=${encodeURIComponent(filter.slice(4))}`;

    fetch(`/api/media${query}`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : Promise.reject('Failed'))
      .then((data: MediaItem[]) => {
        cacheRef.current[filter] = data;
        setItems(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setItems([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filter]);

  // Reset page if needed
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [items, currentPage]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  // Keyboard handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isFullscreen ? exitFullscreen() : setSelected(null);
      }
      if (selected?.type === 'video') {
        if (e.key === 'ArrowLeft') skipVideo(-30);
        if (e.key === 'ArrowRight') skipVideo(30);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen, selected]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterFullscreen = useCallback(() => {
    modalRef.current?.requestFullscreen?.()?.catch(console.error);
  }, []);

  const exitFullscreen = useCallback(() => {
    document.fullscreenElement && document.exitFullscreen?.()?.catch(console.error);
  }, []);

  const skipVideo = useCallback((seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  }, []);

  const openItem = useCallback((item: MediaItem) => setSelected(item), []);

  const closeModal = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    setSelected(null);
  }, [isFullscreen]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginatedItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-4xl font-bold">Gobinda❤️Priya</h2>
          <p className="text-white-400 ">Images and Videos Collection</p>
        </div>

        {/* Filter Buttons */}
        <div className="relative mb-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-gray-900 to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-gray-900 to-transparent sm:hidden" />
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 scrollbar-hide sm:justify-center sm:px-0">
            {filters.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setFilter(value); setCurrentPage(1); }}
                className={`shrink-0 rounded-lg px-6 py-2 font-medium transition ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>
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
            <div className="grid gap-2 grid-cols-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => openItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openItem(item)}
                  className="group cursor-pointer overflow-hidden rounded-xl bg-gray-800 shadow-lg transition hover:scale-105"
                >
                  <div className="relative aspect-square overflow-hidden sm:aspect-video">
                    {item.type === 'image' ? (
                      <Image
                        src={item.src}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 33vw"
                        priority={index < 12}
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
                    <div className="absolute left-1 top-1 sm:left-3 sm:top-3 rounded-full bg-black/60 px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-medium uppercase backdrop-blur">
                      {item.type === 'image' ? 'IMG' : 'VID'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {items.length === 0 && (
              <div className="py-20 text-center text-gray-500">No items found</div>
            )}

            {/* Pagination */}
            {items.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div
          ref={modalRef}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isFullscreen ? 'bg-black' : 'bg-black/70'}`}
          onClick={closeModal}
        >
          <div
            className={`relative ${isFullscreen ? 'h-screen w-screen' : 'max-h-[90vh] w-full max-w-4xl'} overflow-hidden rounded-lg bg-black`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Control buttons */}
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <button
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="rounded-md bg-black/50 p-2 text-white hover:bg-black/60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isFullscreen ? (
                    <>
                      <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                    </>
                  ) : (
                    <>
                      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                    </>
                  )}
                </svg>
              </button>
              <button onClick={closeModal} aria-label="Close" className="rounded-md bg-black/50 p-2 text-white hover:bg-black/60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selected.type === 'image' ? (
              <div className={`relative flex h-full ${isFullscreen ? 'min-h-screen' : 'min-h-[40vh]'} w-full items-center justify-center bg-black`}>
                <Image src={selected.src} alt={selected.title} fill sizes="100vw" className="object-contain" priority />
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={selected.src}
                  poster={selected.poster}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full bg-black"
                  style={{ maxHeight: isFullscreen ? '100vh' : '90vh' }}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                />
                {/* Skip buttons jjj*/}
                <div className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-between px-4 pointer-events-none">
                  <button
                    onClick={(e) => { e.stopPropagation(); skipVideo(-30); }}
                    aria-label="Skip backward 30 seconds"
                    className="pointer-events-auto rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5" />
                      <text x="12" y="16" fontSize="8" textAnchor="middle" fill="currentColor">30</text>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); skipVideo(30); }}
                    aria-label="Skip forward 30 seconds"
                    className="pointer-events-auto rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5" />
                      <text x="12" y="16" fontSize="8" textAnchor="middle" fill="currentColor">30</text>
                    </svg>
                  </button>
                </div>
              </>
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
