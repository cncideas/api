import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Multer } from 'multer';
import { ProductosService } from './productos.service';
import { ProductosDto } from './productos.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // Crear producto con múltiples imágenes
  @Post()
  @UseInterceptors(FilesInterceptor('imagenes', 10, { // Máximo 10 imágenes
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo por imagen
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
  }))
  async create(
    @Body() productosDto: ProductosDto,
    @UploadedFiles() imagenes?: Express.Multer.File[],
  ) {
    return this.productosService.create(productosDto, imagenes);
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

  // Obtener imagen específica de un producto por índice
  @Get(':id/imagen/:index')
  async getImage(@Param('id') id: string, @Param('index') index: string, @Res() res: Response) {
    try {
      const imageIndex = parseInt(index, 10);
      if (isNaN(imageIndex) || imageIndex < 0) {
        throw new BadRequestException('El índice debe ser un número válido');
      }
      
      const imageBuffer = await this.productosService.getProductImage(id, imageIndex);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length.toString(),
      });
      
      res.send(imageBuffer);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Obtener todas las imágenes de un producto
  @Get(':id/imagenes')
  async getAllImages(@Param('id') id: string) {
    return this.productosService.getAllProductImages(id);
  }

  // Obtener producto por ID
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('withImages') withImages?: string,
  ) {
    if (withImages === 'true') {
      return this.productosService.findOneWithImages(id);
    }
    return this.productosService.findOne(id);
  }

  // Actualizar producto
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('imagenes', 10, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo por imagen
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
  }))
  async update(
    @Param('id') id: string,
    @Body() updateProductosDto: Partial<ProductosDto>,
    @UploadedFiles() imagenes?: Express.Multer.File[],
  ) {
    return this.productosService.update(id, updateProductosDto, imagenes);
  }

  // Agregar nuevas imágenes sin reemplazar las existentes
  @Post(':id/imagenes')
  @UseInterceptors(FilesInterceptor('imagenes', 10, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo por imagen
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
  }))
  async addImages(
    @Param('id') id: string,
    @UploadedFiles() imagenes: Express.Multer.File[],
  ) {
    if (!imagenes || imagenes.length === 0) {
      throw new BadRequestException('Se requiere al menos una imagen');
    }
    return this.productosService.addImages(id, imagenes);
  }

  // Reemplazar todas las imágenes
  @Patch(':id/imagenes')
  @UseInterceptors(FilesInterceptor('imagenes', 10, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo por imagen
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Solo se permiten archivos de imagen'), false);
      }
      callback(null, true);
    },
  }))
  async replaceAllImages(
    @Param('id') id: string,
    @UploadedFiles() imagenes: Express.Multer.File[],
  ) {
    if (!imagenes || imagenes.length === 0) {
      throw new BadRequestException('Se requiere al menos una imagen');
    }
    return this.productosService.replaceAllImages(id, imagenes);
  }

  // Eliminar una imagen específica por índice
  @Delete(':id/imagen/:index')
  async removeImage(@Param('id') id: string, @Param('index') index: string) {
    const imageIndex = parseInt(index, 10);
    if (isNaN(imageIndex) || imageIndex < 0) {
      throw new BadRequestException('El índice debe ser un número válido');
    }
    return this.productosService.removeImage(id, imageIndex);
  }

  // Eliminar todas las imágenes
  @Delete(':id/imagenes')
  async removeAllImages(@Param('id') id: string) {
    return this.productosService.removeAllImages(id);
  }

  // Eliminar producto
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productosService.remove(id);
  }
}