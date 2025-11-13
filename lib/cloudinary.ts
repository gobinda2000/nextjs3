import { unstable_cache } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';

type CloudinaryResourceType = 'image' | 'video';

const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(
      `Missing Cloudinary environment variable: ${key}. Set it in your Vercel project settings.`,
    );
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type CloudinarySearchResource = {
  asset_id: string;
  resource_type: string;
  secure_url: string;
  thumbnail_url?: string | null;
  public_id: string;
  width?: number | null;
  height?: number | null;
};

type FetchResult = Array<{
  id: string;
  type: CloudinaryResourceType;
  src: string;
  poster?: string;
  title: string;
  width?: number;
  height?: number;
}>;

const buildVideoPosterUrl = (publicId: string) =>
  cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width: 960, height: 540, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    secure: true,
  });

const fetchCloudinaryMedia = async (type?: CloudinaryResourceType): Promise<FetchResult> => {
  const parts: string[] = [];

  if (process.env.CLOUDINARY_FOLDER) {
    parts.push(`folder:${process.env.CLOUDINARY_FOLDER}`);
  }
  if (type) {
    parts.push(`resource_type:${type}`);
  }

  const expression =
    parts.join(' AND ') || 'resource_type:image OR resource_type:video';

  const { resources } = await cloudinary.search
    .expression(expression)
    .sort_by('created_at', 'desc')
    .max_results(30)
    .execute();

  return (resources as CloudinarySearchResource[]).map(
    (resource: CloudinarySearchResource) => ({
    id: resource.asset_id,
    type: resource.resource_type as CloudinaryResourceType,
    src: resource.secure_url,
    poster:
      resource.resource_type === 'video'
        ? resource.thumbnail_url ?? buildVideoPosterUrl(resource.public_id)
        : undefined,
    title: resource.public_id,
    width: resource.width ?? undefined,
    height: resource.height ?? undefined,
    }),
  );
};

const cachedFetchCloudinaryMedia = unstable_cache(fetchCloudinaryMedia, ['cloudinary-media'], {
  revalidate: 300,
  tags: ['cloudinary-media'],
});

export async function fetchMedia(type?: CloudinaryResourceType) {
  return cachedFetchCloudinaryMedia(type);
}