  import { v2 as cloudinary } from 'cloudinary';

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  export async function fetchMedia(type?: 'image' | 'video') {
    const expression = [
      process.env.CLOUDINARY_FOLDER ? `folder:${process.env.CLOUDINARY_FOLDER}` : '',
      type ? `resource_type:${type}` : '',
    ]
      .filter(Boolean)
      .join(' AND ');

    const { resources } = await cloudinary.search
      .expression(expression || 'resource_type:image OR resource_type:video')
      .max_results(30)
      .execute();

    return resources.map((r) => ({
      id: r.asset_id,
      type: r.resource_type as 'image' | 'video',
      src: r.secure_url,
      poster: r.resource_type === 'video' ? r.thumbnail_url ?? r.secure_url : undefined,
      title: r.public_id,
    }));
  }