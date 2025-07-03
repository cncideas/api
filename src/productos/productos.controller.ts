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
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Multer } from 'multer';
import { ProductosService } from './productos.service';
import { ProductosDto } from './productos.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // Crear producto con imagen
  @Post()
  @UseInterceptors(FileInterceptor('imagen', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
  }))
  async create(
    @Body() productosDto: ProductosDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.productosService.create(productosDto, imagen);
  }

  // Obtener todos los productos (sin imágenes)
  @Get()
  async findAll(@Query('withImages') withImages?: string, @Query('frontend') frontend?: string) {
    if (frontend === 'true') {
      return this.productosService.findAllForFrontend();
    }
    if (withImages === 'true') {
      return this.productosService.findAllWithImages();
    }
    return this.productosService.findAll();
  }

  // Obtener productos para frontend (con imágenes en base64)
  @Get('frontend')
  async findAllForFrontend() {
    return this.productosService.findAllForFrontend();
  }

  // Obtener productos paginados
  @Get('paginated')
  async findPaginated(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('frontend') frontend?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Los parámetros page y limit deben ser números positivos');
    }
    
    if (frontend === 'true') {
      return this.productosService.findForFrontendPaginated(pageNum, limitNum);
    }
    
    return this.productosService.findWithPagination(pageNum, limitNum);
  }

  // Buscar productos por nombre
  @Get('search')
  async findByName(@Query('nombre') nombre: string) {
    if (!nombre) {
      throw new BadRequestException('El parámetro nombre es requerido');
    }
    return this.productosService.findByName(nombre);
  }

  // Buscar productos por categoría
  @Get('categoria/:categoriaId')
  async findByCategory(@Param('categoriaId') categoriaId: string) {
    return this.productosService.findByCategory(categoriaId);
  }

  // Obtener imagen de un producto
  @Get(':id/imagen')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    try {
      const imageBuffer = await this.productosService.getProductImage(id);
      
      res.set({
        'Content-Type': 'image/jpeg', // Puedes hacer esto más dinámico
        'Content-Length': imageBuffer.length.toString(),
      });
      
      res.send(imageBuffer);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Obtener producto por ID
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('withImage') withImage?: string,
  ) {
    if (withImage === 'true') {
      return this.productosService.findOneWithImage(id);
    }
    return this.productosService.findOne(id);
  }

  // Actualizar producto
  @Patch(':id')
  @UseInterceptors(FileInterceptor('imagen', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
  }))
  async update(
    @Param('id') id: string,
    @Body() updateProductosDto: Partial<ProductosDto>,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.productosService.update(id, updateProductosDto, imagen);
  }

  // Actualizar solo la imagen
  @Patch(':id/imagen')
  @UseInterceptors(FileInterceptor('imagen', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
  }))
  async updateImage(
    @Param('id') id: string,
    @UploadedFile() imagen: Express.Multer.File,
  ) {
    if (!imagen) {
      throw new BadRequestException('La imagen es requerida');
    }
    return this.productosService.updateImage(id, imagen);
  }

  // Eliminar imagen
  @Delete(':id/imagen')
  async removeImage(@Param('id') id: string) {
    return this.productosService.removeImage(id);
  }

  // Eliminar producto
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productosService.remove(id);
  }
}