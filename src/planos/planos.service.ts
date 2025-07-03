import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPlanos } from './planos.Model';
import { Dificultad, PlanosDto } from './planos.Dto';


@Injectable()
export class PlanosService {
  constructor(
    @InjectModel('Planos') private readonly planosModel: Model<IPlanos>,
  ) {}

  // Crear plano con archivo PDF
  async create(planosDto: PlanosDto, pdfFile?: Express.Multer.File): Promise<IPlanos> {
    try {
      const planoData = {
        ...planosDto,
        archivo: pdfFile ? pdfFile.buffer : null,
        creado: new Date(),
        actualizado: new Date(),
      };

      const nuevoPlano = new this.planosModel(planoData);
      return await nuevoPlano.save();
    } catch (error) {
      throw new BadRequestException(`Error al crear plano: ${error.message}`);
    }
  }

  // Obtener todos los planos (sin incluir los archivos PDF para optimizar)
  async findAll(): Promise<IPlanos[]> {
    try {
      return await this.planosModel
        .find()
        .select('-archivo') // Excluir archivo PDF para optimizar la consulta
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al obtener planos: ${error.message}`);
    }
  }

  // Obtener todos los planos con archivos PDF (para casos específicos)
  async findAllWithFiles(): Promise<IPlanos[]> {
    try {
      return await this.planosModel
        .find()
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al obtener planos con archivos: ${error.message}`);
    }
  }

  // Método optimizado para preview - solo datos necesarios para mostrar cards
  async findAllForPreview(): Promise<any[]> {
    try {
      const planos = await this.planosModel
        .find()
        .select('-archivo') // Sin el archivo PDF completo
        .exec();

      return planos.map(plano => ({
        _id: plano._id,
        titulo: plano.titulo,
        descripcion: plano.descripcion,
        categoria: plano.categoria,
        tipo_maquina: plano.tipo_maquina,
        dificultad: plano.dificultad,
        total_paginas: plano.total_paginas,
        precio: plano.precio,
        descripcion_preview: plano.descripcion_preview,
        autor: plano.autor,
        version: plano.version,
        preview: plano.preview, // Páginas que se pueden mostrar
        creado: plano.creado,
      }));
    } catch (error) {
      throw new BadRequestException(`Error al obtener planos para preview: ${error.message}`);
    }
  }

  // Método paginado para el frontend con información de preview
  async findForPreviewPaginated(page: number = 1, limit: number = 10): Promise<{
    planos: any[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [planos, total] = await Promise.all([
        this.planosModel
          .find()
          .select('-archivo')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.planosModel.countDocuments().exec(),
      ]);

      const planosPreview = planos.map(plano => ({
        _id: plano._id,
        titulo: plano.titulo,
        descripcion: plano.descripcion,
        categoria: plano.categoria,
        tipo_maquina: plano.tipo_maquina,
        dificultad: plano.dificultad,
        total_paginas: plano.total_paginas,
        precio: plano.precio,
        descripcion_preview: plano.descripcion_preview,
        autor: plano.autor,
        version: plano.version,
        preview: plano.preview,
        creado: plano.creado,
      }));

      return {
        planos: planosPreview,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener planos paginados para preview: ${error.message}`);
    }
  }

  // Obtener plano por ID (sin archivo PDF)
  async findOne(id: string): Promise<IPlanos> {
    try {
      const plano = await this.planosModel
        .findById(id)
        .select('-archivo') // Sin archivo por defecto
        .exec();

      if (!plano) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return plano;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener plano: ${error.message}`);
    }
  }

  // Obtener plano por ID con archivo PDF (solo para compras autorizadas)
  async findOneWithFile(id: string): Promise<IPlanos> {
    try {
      const plano = await this.planosModel
        .findById(id)
        .exec();

      if (!plano) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return plano;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener plano con archivo: ${error.message}`);
    }
  }

  // Obtener solo el archivo PDF de un plano (para descargas autorizadas)
  async getPlanoFile(id: string): Promise<Buffer> {
    try {
      const plano = await this.planosModel
        .findById(id)
        .select('archivo titulo')
        .exec();

      if (!plano) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      if (!plano.archivo) {
        throw new NotFoundException(`El plano no tiene archivo`);
      }

      return plano.archivo;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener archivo: ${error.message}`);
    }
  }

  // Obtener información específica para preview (páginas permitidas)
  async getPreviewInfo(id: string): Promise<{
    titulo: string;
    descripcion_preview: string;
    preview: number[];
    total_paginas: number;
    precio: number;
  }> {
    try {
      const plano = await this.planosModel
        .findById(id)
        .select('titulo descripcion_preview preview total_paginas precio')
        .exec();

      if (!plano) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return {
        titulo: plano.titulo,
        descripcion_preview: plano.descripcion_preview,
        preview: plano.preview,
        total_paginas: plano.total_paginas,
        precio: plano.precio,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener información de preview: ${error.message}`);
    }
  }

  // Actualizar plano
  async update(id: string, updatePlanosDto: Partial<PlanosDto>, pdfFile?: Express.Multer.File): Promise<IPlanos> {
    try {
      const updateData = { 
        ...updatePlanosDto,
        actualizado: new Date(),
      };
      
      // Si se proporciona un nuevo archivo PDF, agregarlo a los datos de actualización
      if (pdfFile) {
        updateData.archivo = pdfFile.buffer;
      }

      const planoActualizado = await this.planosModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!planoActualizado) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return planoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al actualizar plano: ${error.message}`);
    }
  }

  // Actualizar solo el archivo PDF
  async updateFile(id: string, pdfFile: Express.Multer.File): Promise<IPlanos> {
    try {
      const planoActualizado = await this.planosModel
        .findByIdAndUpdate(
          id, 
          { 
            archivo: pdfFile.buffer,
            actualizado: new Date(),
          }, 
          { new: true }
        )
        .exec();

      if (!planoActualizado) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return planoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al actualizar archivo: ${error.message}`);
    }
  }

  // Eliminar archivo de un plano
  async removeFile(id: string): Promise<IPlanos> {
    try {
      const planoActualizado = await this.planosModel
        .findByIdAndUpdate(
          id, 
          { 
            $unset: { archivo: 1 },
            actualizado: new Date(),
          }, 
          { new: true }
        )
        .exec();

      if (!planoActualizado) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return planoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al eliminar archivo: ${error.message}`);
    }
  }

  // Eliminar plano
  async remove(id: string): Promise<void> {
    try {
      const resultado = await this.planosModel.findByIdAndDelete(id).exec();
      
      if (!resultado) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al eliminar plano: ${error.message}`);
    }
  }

  // Buscar planos por título
  async findByTitle(titulo: string): Promise<IPlanos[]> {
    try {
      return await this.planosModel
        .find({ titulo: { $regex: titulo, $options: 'i' } })
        .select('-archivo')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al buscar planos: ${error.message}`);
    }
  }

  // Buscar planos por categoría
  async findByCategory(categoria: string): Promise<IPlanos[]> {
    try {
      return await this.planosModel
        .find({ categoria: { $regex: categoria, $options: 'i' } })
        .select('-archivo')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al buscar planos por categoría: ${error.message}`);
    }
  }

  // Buscar planos por tipo de máquina
  async findByMachineType(tipo_maquina: string): Promise<IPlanos[]> {
    try {
      return await this.planosModel
        .find({ tipo_maquina: { $regex: tipo_maquina, $options: 'i' } })
        .select('-archivo')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al buscar planos por tipo de máquina: ${error.message}`);
    }
  }

  // Buscar planos por dificultad
  async findByDifficulty(dificultad: Dificultad): Promise<IPlanos[]> {
    try {
      return await this.planosModel
        .find({ dificultad })
        .select('-archivo')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al buscar planos por dificultad: ${error.message}`);
    }
  }

  // Buscar planos por rango de precio
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<IPlanos[]> {
    try {
      return await this.planosModel
        .find({ 
          precio: { 
            $gte: minPrice, 
            $lte: maxPrice 
          } 
        })
        .select('-archivo')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al buscar planos por precio: ${error.message}`);
    }
  }

  // Obtener planos con paginación y filtros
  async findWithFilters(filters: {
    categoria?: string;
    tipo_maquina?: string;
    dificultad?: Dificultad;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    planos: any[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const { page = 1, limit = 10, ...filterCriteria } = filters;
      const skip = (page - 1) * limit;

      // Construir query de filtros
      const query: any = {};
      
      if (filterCriteria.categoria) {
        query.categoria = { $regex: filterCriteria.categoria, $options: 'i' };
      }
      
      if (filterCriteria.tipo_maquina) {
        query.tipo_maquina = { $regex: filterCriteria.tipo_maquina, $options: 'i' };
      }
      
      if (filterCriteria.dificultad) {
        query.dificultad = filterCriteria.dificultad;
      }
      
      if (filterCriteria.minPrice !== undefined || filterCriteria.maxPrice !== undefined) {
        query.precio = {};
        if (filterCriteria.minPrice !== undefined) {
          query.precio.$gte = filterCriteria.minPrice;
        }
        if (filterCriteria.maxPrice !== undefined) {
          query.precio.$lte = filterCriteria.maxPrice;
        }
      }

      const [planos, total] = await Promise.all([
        this.planosModel
          .find(query)
          .select('-archivo')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.planosModel.countDocuments(query).exec(),
      ]);

      const planosPreview = planos.map(plano => ({
        _id: plano._id,
        titulo: plano.titulo,
        descripcion: plano.descripcion,
        categoria: plano.categoria,
        tipo_maquina: plano.tipo_maquina,
        dificultad: plano.dificultad,
        total_paginas: plano.total_paginas,
        precio: plano.precio,
        descripcion_preview: plano.descripcion_preview,
        autor: plano.autor,
        version: plano.version,
        preview: plano.preview,
        creado: plano.creado,
      }));

      return {
        planos: planosPreview,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener planos filtrados: ${error.message}`);
    }
  }
}
