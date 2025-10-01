import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SchemaInitService implements OnModuleInit {
  private readonly logger = new Logger(SchemaInitService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  // Chạy khi module khởi tạo (khi app boot)
  async onModuleInit(): Promise<void> {
    // MIGRATE_ON_BOOT=true thì mới chạy
    const shouldMigrate = (this.config.get<string>('MIGRATE_ON_BOOT') || '').toLowerCase() === 'true';
    if (!shouldMigrate) {
      this.logger.log('MIGRATE_ON_BOOT=false → bỏ qua chạy DDL schema');
      return;
    }

    // Đường dẫn file schema.sql chứa toàn bộ DDL
    const schemaFilePath = path.join(__dirname, 'sql', 'schema.sql');

    if (!fs.existsSync(schemaFilePath)) {
      this.logger.warn(`Không tìm thấy file schema: ${schemaFilePath}`);
      return;
    }

    // Đọc nội dung SQL và thực thi (idempotent)
    try {
      let sql = fs.readFileSync(schemaFilePath, 'utf8');
      // Tránh lỗi do partial index phụ thuộc deleted_at: file đã bỏ WHERE, phòng ngừa thêm ở đây
      sql = sql.replace(/WHERE deleted_at IS NULL/gi, '');
      this.logger.log('Bắt đầu áp dụng DDL schema...');
      await this.dataSource.query(sql);
      this.logger.log('Áp dụng DDL schema thành công.');
    } catch (error) {
      this.logger.error('Lỗi khi chạy DDL schema', (error as Error).stack);
      throw error;
    }
  }
}


