import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../datasources/prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import { ListNotificationTemplatesDto } from './dto/list-notification-templates.dto';

// projectId: null means the global/default override row (falls back to
// file-based DEFAULT_TEMPLATES if absent). Shared by both the top-level
// /templates controller (always passes null) and /projects/:id/templates
// (always passes the path param) — see template.service.ts's render()
// for how these rows are resolved at send time.
@Injectable()
export class NotificationTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string | null, dto: CreateNotificationTemplateDto) {
    try {
      return await this.prisma.notificationTemplate.create({
        data: { ...dto, projectId },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A template with this key and channel already exists for this scope');
      }
      throw err;
    }
  }

  async findAll(projectId: string | null, query: ListNotificationTemplatesDto): Promise<PaginatedResult<unknown>> {
    const where: Prisma.NotificationTemplateWhereInput = {
      projectId,
      ...(query.channel && { channel: query.channel }),
    };

    const [items, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({ where, take: query.limit, skip: query.offset, orderBy: { key: 'asc' } }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return { items, limit: query.limit, offset: query.offset, total };
  }

  async findOne(projectId: string | null, id: string) {
    const template = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template || template.projectId !== projectId) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    return template;
  }

  async update(projectId: string | null, id: string, dto: UpdateNotificationTemplateDto) {
    await this.findOne(projectId, id);
    try {
      return await this.prisma.notificationTemplate.update({ where: { id }, data: dto });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A template with this key and channel already exists for this scope');
      }
      throw err;
    }
  }

  async remove(projectId: string | null, id: string) {
    await this.findOne(projectId, id);
    await this.prisma.notificationTemplate.delete({ where: { id } });
  }
}
