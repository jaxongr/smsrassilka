import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { parseCsv } from './helpers/csv-parser.helper';
import { parseExcel } from './helpers/excel-parser.helper';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllGroups(userId: string) {
    return this.prisma.contactGroup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    return this.prisma.contactGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        userId,
      },
    });
  }

  async findGroup(id: string) {
    const group = await this.prisma.contactGroup.findUnique({
      where: { id },
      include: { contacts: true },
    });

    if (!group) {
      throw new NotFoundException(`Contact group with ID "${id}" not found`);
    }

    return group;
  }

  async updateGroup(id: string, dto: CreateGroupDto) {
    await this.findGroup(id);

    return this.prisma.contactGroup.update({
      where: { id },
      data: dto,
    });
  }

  async removeGroup(id: string) {
    await this.findGroup(id);

    return this.prisma.contactGroup.delete({
      where: { id },
    });
  }

  async findGroupContacts(id: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where: { groupId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({
        where: { groupId: id },
      }),
    ]);

    return {
      data: contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addContact(groupId: string, dto: CreateContactDto) {
    const contact = await this.prisma.contact.create({
      data: {
        phoneNumber: dto.phoneNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        groupId,
      },
    });

    await this.prisma.contactGroup.update({
      where: { id: groupId },
      data: { contactCount: { increment: 1 } },
    });

    return contact;
  }

  async addContacts(groupId: string, contacts: CreateContactDto[]) {
    const result = await this.prisma.contact.createMany({
      data: contacts.map((c) => ({
        phoneNumber: c.phoneNumber,
        firstName: c.firstName,
        lastName: c.lastName,
        groupId,
      })),
      skipDuplicates: true,
    });

    await this.prisma.contactGroup.update({
      where: { id: groupId },
      data: { contactCount: { increment: result.count } },
    });

    return result;
  }

  async removeContact(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    await this.prisma.contact.delete({ where: { id } });

    await this.prisma.contactGroup.update({
      where: { id: contact.groupId },
      data: { contactCount: { decrement: 1 } },
    });

    return contact;
  }

  async importFromFile(groupId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    let contacts: { phoneNumber: string; firstName?: string; lastName?: string }[];

    try {
      if (ext === 'txt') {
        const text = file.buffer.toString('utf-8');
        contacts = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((phoneNumber) => ({ phoneNumber }));
      } else if (ext === 'csv') {
        contacts = parseCsv(file.buffer);
      } else if (['xlsx', 'xls'].includes(ext || '')) {
        contacts = parseExcel(file.buffer);
      } else {
        throw new BadRequestException(
          'Unsupported file format. Use CSV, XLSX, or TXT.',
        );
      }
    } catch (error) {
      throw new BadRequestException(`Failed to parse file: ${error.message}`);
    }

    if (!contacts.length) {
      throw new BadRequestException('No valid contacts found in file');
    }

    const result = await this.prisma.contact.createMany({
      data: contacts.map((c) => ({
        phoneNumber: c.phoneNumber,
        firstName: c.firstName,
        lastName: c.lastName,
        groupId,
      })),
      skipDuplicates: true,
    });

    await this.prisma.contactGroup.update({
      where: { id: groupId },
      data: { contactCount: { increment: result.count } },
    });

    this.logger.log(
      `Imported ${result.count} contacts into group ${groupId}`,
    );

    return {
      imported: result.count,
      total: contacts.length,
    };
  }
}
