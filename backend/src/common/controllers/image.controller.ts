import { Controller, Get, Post, Delete, Param, UseInterceptors, UploadedFile, NotFoundException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from '../services/image.service';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Trả về url CDN sau khi upload thành công
    const image = await this.imageService.uploadImage(file);
    return { url: image.url };
  }

  @Get(':id')
  async getImage(@Param('id') id: string) {
    // Lấy url CDN của ảnh và trả về cho client
    const image = await this.imageService.getImageUrl(id);
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    return { url: image.url };
  }

  @Get(':id/info')
  async getImageInfo(@Param('id') id: string) {
    const info = await this.imageService.getImageInfo(id);
    if (!info) {
      throw new NotFoundException('Image not found');
    }
    return info;
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string) {
    const success = await this.imageService.deleteImage(id);
    if (!success) {
      throw new NotFoundException('Image not found');
    }
    return { success: true };
  }
}
