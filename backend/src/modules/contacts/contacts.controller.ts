import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ContactsService } from './contacts.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get('contact-groups')
  @ApiOperation({ summary: 'Get all contact groups' })
  findAllGroups(@CurrentUser('id') userId: string) {
    return this.contactsService.findAllGroups(userId);
  }

  @Post('contact-groups')
  @ApiOperation({ summary: 'Create a contact group' })
  createGroup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.contactsService.createGroup(userId, dto);
  }

  @Get('contact-groups/:id')
  @ApiOperation({ summary: 'Get contact group by ID' })
  findGroup(@Param('id') id: string) {
    return this.contactsService.findGroup(id);
  }

  @Patch('contact-groups/:id')
  @ApiOperation({ summary: 'Update contact group' })
  updateGroup(@Param('id') id: string, @Body() dto: CreateGroupDto) {
    return this.contactsService.updateGroup(id, dto);
  }

  @Delete('contact-groups/:id')
  @ApiOperation({ summary: 'Delete contact group' })
  removeGroup(@Param('id') id: string) {
    return this.contactsService.removeGroup(id);
  }

  @Get('contact-groups/:id/contacts')
  @ApiOperation({ summary: 'Get contacts in a group (paginated)' })
  findGroupContacts(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.contactsService.findGroupContacts(id, page, limit);
  }

  @Post('contact-groups/:id/contacts')
  @ApiOperation({ summary: 'Add a contact to a group' })
  addContact(
    @Param('id') groupId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.addContact(groupId, dto);
  }

  @Post('contact-groups/:id/import')
  @ApiOperation({ summary: 'Import contacts from CSV/Excel/TXT file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  importContacts(
    @Param('id') groupId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.contactsService.importFromFile(groupId, file);
  }

  @Delete('contacts/:id')
  @ApiOperation({ summary: 'Remove a contact' })
  removeContact(@Param('id') id: string) {
    return this.contactsService.removeContact(id);
  }
}
