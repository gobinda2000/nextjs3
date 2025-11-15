import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

const resourceClause = ['resource_type:image', 'resource_type:video'];

export async function GET() {
  try {
    let expression = `(${resourceClause.join(' OR ')})`;
    if (process.env.CLOUDINARY_FOLDER) {
      expression = `${expression} AND folder:${process.env.CLOUDINARY_FOLDER}`;
    }

    const { resources } = await cloudinary.search
      .expression(expression)
      .with_field('tags')
      .max_results(100)
      .execute();

    const tags = Array.from(
      new Set(
        (resources ?? [])
          .flatMap((asset: { tags?: string[] }) => asset.tags ?? [])
          .map((tag: string) => tag.trim())
          .filter(Boolean),
      ),
    );

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Failed to list Cloudinary tags', error);
    return NextResponse.json([], { status: 500 });
  }
}