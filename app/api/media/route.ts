import { NextResponse } from 'next/server';
import { fetchMedia } from '@/lib/cloudinary';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const tag = searchParams.get('tag') ?? undefined;

  const type =
    typeParam === 'image' || typeParam === 'video' ? typeParam : undefined;

  try {
    const media = await fetchMedia({ type, tag });
    return NextResponse.json(media);
  } catch (error) {
    console.error('Failed to fetch media', error);
    return NextResponse.json([], { status: 500 });
  }
}