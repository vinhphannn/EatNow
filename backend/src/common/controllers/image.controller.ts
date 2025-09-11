import { Controller, Get, Post, Delete, Param, UseInterceptors, UploadedFile, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
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

    return await this.imageService.uploadImage(file);
  }

  @Get(':id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const image = await this.imageService.getImage(id);
    if (!image) {
      throw new NotFoundException('Image not found');
    }

    res.set({
      'Content-Type': image.mimeType,
      'Content-Length': image.data.length,
      'Cache-Control': 'public, max-age=31536000', // 1 year cache
    });

    res.send(image.data);
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
