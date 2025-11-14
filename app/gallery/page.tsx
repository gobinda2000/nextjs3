export const dynamic = 'force-dynamic';

async function getMedia() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/media`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch media');
  return res.json();
}

export default async function GalleryPage() {
  const media = await getMedia();

  return (
    <main className="grid gap-4 md:grid-cols-3">
      {media.resources.map((item: any) => (
        <figure key={item.asset_id} className="rounded shadow">
          <img src={item.secure_url} alt={item.public_id} loading="lazy" />
        </figure>
      ))}
    </main>
  );
}