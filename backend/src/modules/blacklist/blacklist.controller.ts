import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BlacklistService } from './blacklist.service';

@ApiTags('Blacklist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/blacklist')
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blacklisted numbers (paginated)' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.blacklistService.findAll(page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Add a phone number to the blacklist' })
  add(
    @Body('phoneNumber') phoneNumber: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.blacklistService.add(phoneNumber, reason, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a phone number from the blacklist' })
  remove(@Param('id') id: string) {
    return this.blacklistService.remove(id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import phone numbers from a file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  importFromFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.blacklistService.importFromFile(file, userId);
  }
}
