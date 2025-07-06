import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PlanosService } from './planos.service';
import { PlanosDto } from './planos.Dto';

@Controller('planos')
export class PlanosController {
  constructor(private readonly planosService: PlanosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async create(
    @Body() createPlanosDto: PlanosDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo PDF es requerido');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    return await this.planosService.create(createPlanosDto, file);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    return await this.planosService.findAll(pageNumber, limitNumber);
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
  ) {
    if (!query) {
      throw new BadRequestException('El parámetro de búsqueda es requerido');
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    return await this.planosService.search(query, pageNumber, limitNumber);
  }

  // Obtener preview del PDF con páginas limitadas (IMPLEMENTACIÓN COMPLETA)
  @Get('preview/:id')
  async getPreview(@Param('id') id: string, @Res() res: Response) {
    try {
      const previewData = await this.planosService.getPlanoPreview(id);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${previewData.titulo}_preview.pdf"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Preview-Pages': previewData.previewPages.join(','),
      });

      res.end(previewData.buffer);
      
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: `Error al obtener preview: ${error.message}`,
      });
    }
  }

  // Descargar archivo PDF completo (solo para compras autorizadas)
  @Get('download/:id')
  async downloadFile(
    @Param('id') id: string, 
    @Query('userId') userId: string,
    @Res() res: Response
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('ID de usuario requerido');
      }

      const hasAccess = await this.planosService.hasAccess(id, userId);
      if (!hasAccess) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'No tienes acceso a este plano. Debes comprarlo primero.',
        });
      }

      const { buffer, titulo } = await this.planosService.getPlanoFile(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${titulo}.pdf"`,
        'Content-Length': buffer.length.toString(),
      });

      res.end(buffer);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: `Error al descargar archivo: ${error.message}`,
      });
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.planosService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('archivo'))
  async update(
    @Param('id') id: string,
    @Body() updatePlanosDto: Partial<PlanosDto>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    return await this.planosService.update(id, updatePlanosDto, file);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.planosService.remove(id);
    return {
      message: 'Plano eliminado exitosamente',
      statusCode: HttpStatus.OK,
    };
  }

  @Post('purchase/:id')
  async purchasePlano(
    @Param('id') id: string,
    @Body() purchaseData: { userId: string; paymentMethod?: string },
  ) {
    const result = await this.planosService.purchasePlano(id, purchaseData.userId);
    
    return {
      message: 'Compra procesada exitosamente',
      planoId: id,
      titulo: result.titulo,
      precio: result.precio,
      userId: purchaseData.userId,
      downloadUrl: `/planos/download/${id}?userId=${purchaseData.userId}`,
    };
  }
}