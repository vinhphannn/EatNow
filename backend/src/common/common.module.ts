import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Image, ImageSchema } from './schemas/image.schema';
import { ImageService } from './services/image.service';
import { ImageController } from './controllers/image.controller';
import { DistanceService } from './services/distance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Image.name, schema: ImageSchema },
    ]),
  ],
  controllers: [ImageController],
  providers: [ImageService, DistanceService],
  exports: [ImageService, DistanceService],
})
export class CommonModule {}
