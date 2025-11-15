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
  tags?: string[] | null;
};

type FetchResult = Array<{
  id: string;
  type: CloudinaryResourceType;
  src: string;
  poster?: string;
  title: string;
  width?: number;
  height?: number;
  tags?: string[];
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

const fetchCloudinaryMedia = async (
  type?: CloudinaryResourceType,
  tag?: string,
): Promise<FetchResult> => {
  const resourceClause = type
    ? [`resource_type:${type}`]
    : ['resource_type:image', 'resource_type:video'];
  let expression = `(${resourceClause.join(' OR ')})`;

  const andClauses: string[] = [];

  if (process.env.CLOUDINARY_FOLDER) {
    andClauses.push(`folder:${process.env.CLOUDINARY_FOLDER}`);
  }

  if (tag?.trim()) {
    const cleaned = tag.trim();
    const needsQuotes = /[\s"]/g.test(cleaned);
    const escaped = needsQuotes
      ? `"${cleaned.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
      : cleaned;
    andClauses.push(`tags=${escaped}`);
  }

  if (andClauses.length) {
    expression = `${expression} AND ${andClauses.join(' AND ')}`;
  }

  const { resources } = await cloudinary.search
    .expression(expression)
    .sort_by('created_at', 'desc')
    .max_results(30)
    .execute();

  return (resources as CloudinarySearchResource[]).map((resource) => ({
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
    tags: resource.tags ?? undefined,
  }));
};

const cachedFetchCloudinaryMedia = async (
  type?: CloudinaryResourceType,
  tag?: string,
) =>
  unstable_cache(
    () => fetchCloudinaryMedia(type, tag),
    ['cloudinary-media', type ?? 'all', tag ?? 'all'],
    { revalidate: 300, tags: ['cloudinary-media'] },
  )();

export async function fetchMedia(params: {
  type?: CloudinaryResourceType;
  tag?: string;
} = {}) {
  const { type, tag } = params;
  return cachedFetchCloudinaryMedia(type, tag);
}