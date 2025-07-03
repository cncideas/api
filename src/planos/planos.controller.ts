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
import { Dificultad } from './planos.Dto';

@Controller('planos')
export class PlanosController {
  constructor(private readonly planosService: PlanosService) {}

  // Crear nuevo plano con archivo PDF
  @Post()
  @UseInterceptors(FileInterceptor('archivo'))
  async create(
    @Body() createPlanosDto: PlanosDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('El archivo PDF es requerido');
      }

      // Validar que sea un PDF
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Solo se permiten archivos PDF');
      }

      return await this.planosService.create(createPlanosDto, file);
    } catch (error) {
      throw new BadRequestException(`Error al crear plano: ${error.message}`);
    }
  }

  // Obtener todos los planos (sin archivos PDF para optimizar)
  @Get()
  async findAll() {
    return await this.planosService.findAll();
  }

  // Obtener planos para preview con paginación
  @Get('preview')
  async findForPreview(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (page && limit) {
      return await this.planosService.findForPreviewPaginated(
        Number(page),
        Number(limit),
      );
    }
    return await this.planosService.findAllForPreview();
  }

  // Obtener información específica de preview de un plano
  @Get('preview/:id')
  async getPreviewInfo(@Param('id') id: string) {
    return await this.planosService.getPreviewInfo(id);
  }

  // Buscar planos con filtros y paginación
  @Get('search')
  async searchWithFilters(
    @Query('categoria') categoria?: string,
    @Query('tipo_maquina') tipo_maquina?: string,
    @Query('dificultad') dificultad?: Dificultad,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};

    if (categoria) filters.categoria = categoria;
    if (tipo_maquina) filters.tipo_maquina = tipo_maquina;
    if (dificultad) filters.dificultad = dificultad;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    return await this.planosService.findWithFilters(filters);
  }

  // Buscar planos por título
  @Get('search/title/:titulo')
  async findByTitle(@Param('titulo') titulo: string) {
    return await this.planosService.findByTitle(titulo);
  }

  // Buscar planos por categoría
  @Get('search/categoria/:categoria')
  async findByCategory(@Param('categoria') categoria: string) {
    return await this.planosService.findByCategory(categoria);
  }

  // Buscar planos por tipo de máquina
  @Get('search/tipo-maquina/:tipo')
  async findByMachineType(@Param('tipo') tipo: string) {
    return await this.planosService.findByMachineType(tipo);
  }

  // Buscar planos por dificultad
  @Get('search/dificultad/:dificultad')
  async findByDifficulty(@Param('dificultad') dificultad: Dificultad) {
    return await this.planosService.findByDifficulty(dificultad);
  }

  // Buscar planos por rango de precio
  @Get('search/precio')
  async findByPriceRange(
    @Query('min') min: string,
    @Query('max') max: string,
  ) {
    const minPrice = Number(min);
    const maxPrice = Number(max);

    if (isNaN(minPrice) || isNaN(maxPrice)) {
      throw new BadRequestException('Los precios deben ser números válidos');
    }

    return await this.planosService.findByPriceRange(minPrice, maxPrice);
  }

  // Descargar archivo PDF completo (solo para compras autorizadas)
  @Get('download/:id')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    try {
      // Aquí deberías agregar lógica de autorización/compra
      // Por ejemplo: verificar si el usuario ha comprado el plano
      
      const fileBuffer = await this.planosService.getPlanoFile(id);
      const plano = await this.planosService.findOne(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${plano.titulo}.pdf"`,
        'Content-Length': fileBuffer.length,
      });

      res.end(fileBuffer);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: `Error al descargar archivo: ${error.message}`,
      });
    }
  }

  // Ver PDF en el navegador (solo para compras autorizadas)
  @Get('view/:id')
  async viewFile(@Param('id') id: string, @Res() res: Response) {
    try {
      // Aquí deberías agregar lógica de autorización/compra
      
      const fileBuffer = await this.planosService.getPlanoFile(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      });

      res.end(fileBuffer);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: `Error al mostrar archivo: ${error.message}`,
      });
    }
  }

  // Obtener un plano específico (sin archivo PDF)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.planosService.findOne(id);
  }

  // Obtener un plano con archivo PDF (solo para admin o compras autorizadas)
  @Get('full/:id')
  async findOneWithFile(@Param('id') id: string) {
    // Aquí deberías agregar lógica de autorización/administrador
    return await this.planosService.findOneWithFile(id);
  }

  // Actualizar plano
  @Patch(':id')
  @UseInterceptors(FileInterceptor('archivo'))
  async update(
    @Param('id') id: string,
    @Body() updatePlanosDto: Partial<PlanosDto>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      // Validar que sea un PDF si se proporciona archivo
      if (file && file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Solo se permiten archivos PDF');
      }

      return await this.planosService.update(id, updatePlanosDto, file);
    } catch (error) {
      throw new BadRequestException(`Error al actualizar plano: ${error.message}`);
    }
  }

  // Actualizar solo el archivo PDF
  @Patch('file/:id')
  @UseInterceptors(FileInterceptor('archivo'))
  async updateFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('El archivo PDF es requerido');
      }

      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Solo se permiten archivos PDF');
      }

      return await this.planosService.updateFile(id, file);
    } catch (error) {
      throw new BadRequestException(`Error al actualizar archivo: ${error.message}`);
    }
  }

  // Eliminar archivo PDF de un plano
  @Delete('file/:id')
  async removeFile(@Param('id') id: string) {
    return await this.planosService.removeFile(id);
  }

  // Eliminar plano completo
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.planosService.remove(id);
    return {
      message: 'Plano eliminado exitosamente',
      statusCode: HttpStatus.OK,
    };
  }

  // Endpoint para simular compra (deberías integrarlo con tu sistema de pagos)
  @Post('purchase/:id')
  async purchasePlano(
    @Param('id') id: string,
    @Body() purchaseData: { userId: string; paymentMethod?: string },
  ) {
    try {
      // Aquí deberías agregar la lógica de:
      // 1. Procesar pago
      // 2. Registrar compra en base de datos
      // 3. Dar acceso al usuario al plano completo
      
      const plano = await this.planosService.findOne(id);
      
      // Por ahora solo simulamos la respuesta
      return {
        message: 'Compra procesada exitosamente',
        planoId: id,
        titulo: plano.titulo,
        precio: plano.precio,
        userId: purchaseData.userId,
        // downloadUrl: `/planos/download/${id}`, // URL para descargar
        // viewUrl: `/planos/view/${id}`, // URL para ver en navegador
      };
    } catch (error) {
      throw new BadRequestException(`Error al procesar compra: ${error.message}`);
    }
  }

  // Obtener estadísticas de planos (para admin)
  @Get('admin/stats')
  async getStats() {
    try {
      // Aquí deberías agregar lógica de autorización para admin
      
      const allPlanos = await this.planosService.findAll();
      
      const stats = {
        total: allPlanos.length,
        porCategoria: {},
        porDificultad: {},
        porTipoMaquina: {},
        precioPromedio: 0,
      };

      // Calcular estadísticas
      allPlanos.forEach(plano => {
        // Por categoría
        stats.porCategoria[plano.categoria] = 
          (stats.porCategoria[plano.categoria] || 0) + 1;
        
        // Por dificultad
        stats.porDificultad[plano.dificultad] = 
          (stats.porDificultad[plano.dificultad] || 0) + 1;
        
        // Por tipo de máquina
        stats.porTipoMaquina[plano.tipo_maquina] = 
          (stats.porTipoMaquina[plano.tipo_maquina] || 0) + 1;
      });

      // Precio promedio
      const totalPrecios = allPlanos.reduce((sum, plano) => sum + plano.precio, 0);
      stats.precioPromedio = allPlanos.length > 0 ? totalPrecios / allPlanos.length : 0;

      return stats;
    } catch (error) {
      throw new BadRequestException(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}