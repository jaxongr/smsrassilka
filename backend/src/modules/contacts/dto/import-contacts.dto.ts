import { ApiProperty } from '@nestjs/swagger';

export class ImportContactsDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'CSV or Excel file' })
  file: Express.Multer.File;
}
