import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';

export const CloudinaryProvider = {
  imports: [ConfigModule],
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const cloudName = config.get('CLOUDINARY_SPACE_NAME');
    const apiKey = config.get('CLOUDINARY_API_KEY');
    const apiSecret = config.get('CLOUDINARY_API_SECRET');

    console.log('Cloudinary config:', { cloudName, apiKey, apiSecret });

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    return cloudinary;
  },
};
