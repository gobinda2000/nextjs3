  import { NextResponse } from 'next/server';
  import { fetchMedia } from '@/lib/cloudinary';

  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('type') as 'image' | 'video' | null;

    try {
      const data = await fetchMedia(filter ?? undefined);
      return NextResponse.json(data);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ message: 'Cloudinary fetch failed' }, { status: 500 });
    }
  }