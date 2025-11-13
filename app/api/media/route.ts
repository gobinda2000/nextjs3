import { NextResponse } from 'next/server';
import { fetchMedia } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('type') as 'image' | 'video' | null;

  try {
    const data = await fetchMedia(filter ?? undefined);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Cloudinary fetch failed' },
      { status: 500 },
    );
  }
}