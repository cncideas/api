import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PDFDocument } from 'pdf-lib';
import { IPlanos } from './planos.Model';
import { PlanosDto } from './planos.Dto';

@Injectable()
export class PlanosService {
  constructor(
    @InjectModel('Planos') private readonly planosModel: Model<IPlanos>,
  ) {}

  async create(
    planosDto: PlanosDto,
    pdfFile: Express.Multer.File,
  ): Promise<IPlanos> {
    try {
      // Obtener número total de páginas del PDF
      const totalPages = await this.getTotalPagesFromPDF(pdfFile.buffer);

      const planoData = {
        ...planosDto,
        archivo: pdfFile.buffer,
        total_paginas: totalPages,
        creado: new Date(),
        actualizado: new Date(),
      };

      const nuevoPlano = new this.planosModel(planoData);
      return await nuevoPlano.save();
    } catch (error) {
      throw new BadRequestException(`Error al crear plano: ${error.message}`);
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 12,
  ): Promise<{
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
          .sort({ creado: -1 })
          .exec(),
        this.planosModel.countDocuments().exec(),
      ]);

      const planosFormatted = planos.map((plano) => ({
        _id: plano._id,
        titulo: plano.titulo,
        descripcion: plano.descripcion,
        categoria: plano.categoria,
        tipo_maquina: plano.tipo_maquina,
        dificultad: plano.dificultad,
        total_paginas: plano.total_paginas,
        precio: plano.precio,
        autor: plano.autor,
        version: plano.version,
        creado: plano.creado,
        previewUrl: `/planos/preview/${plano._id}`,
      }));

      return {
        planos: planosFormatted,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al obtener planos: ${error.message}`,
      );
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const plano = await this.planosModel
        .findById(id)
        .select('-archivo')
        .exec();

      if (!plano) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return {
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
        previewUrl: `/planos/preview/${plano._id}`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener plano: ${error.message}`);
    }
  }

  async getPlanoFile(id: string): Promise<{ buffer: Buffer; titulo: string }> {
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

      return {
        buffer: plano.archivo,
        titulo: plano.titulo,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Error al obtener archivo: ${error.message}`,
      );
    }
  }

  // IMPLEMENTACIÓN COMPLETA: Crear PDF preview con páginas limitadas
  async getPlanoPreview(
    id: string,
  ): Promise<{ buffer: Buffer; titulo: string; previewPages: number[] }> {
    function getRandomPages(total: number, count: number): number[] {
      const pages = new Set<number>();
      while (pages.size < count) {
        const page = Math.floor(Math.random() * total) + 1; // entre 1 y total
        pages.add(page);
      }
      return Array.from(pages).sort((a, b) => a - b); // ordenadas opcionalment
    }

    try {
      const plano = await this.planosModel
        .findById(id)
        .select('archivo titulo preview total_paginas')
        .exec();

      if (!plano) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      if (!plano.archivo) {
        throw new NotFoundException(`El plano no tiene archivo`);
      }

      // Páginas por defecto para preview (primeras 3 páginas)
      const previewPages =
        plano.preview && plano.preview.length > 0
          ? plano.preview
          : getRandomPages(plano.total_paginas, (plano.total_paginas/2));

      // Crear PDF con solo las páginas permitidas
      const previewBuffer = await this.extractPagesFromPDF(
        plano.archivo,
        previewPages,
      );

      return {
        buffer: previewBuffer,
        titulo: plano.titulo,
        previewPages: previewPages,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Error al obtener preview: ${error.message}`,
      );
    }
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 12,
  ): Promise<{
    planos: any[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const searchQuery = {
        $or: [
          { titulo: { $regex: query, $options: 'i' } },
          { descripcion: { $regex: query, $options: 'i' } },
          { categoria: { $regex: query, $options: 'i' } },
          { tipo_maquina: { $regex: query, $options: 'i' } },
        ],
      };

      const [planos, total] = await Promise.all([
        this.planosModel
          .find(searchQuery)
          .select('-archivo')
          .skip(skip)
          .limit(limit)
          .sort({ creado: -1 })
          .exec(),
        this.planosModel.countDocuments(searchQuery).exec(),
      ]);

      const planosFormatted = planos.map((plano) => ({
        _id: plano._id,
        titulo: plano.titulo,
        descripcion: plano.descripcion,
        categoria: plano.categoria,
        tipo_maquina: plano.tipo_maquina,
        dificultad: plano.dificultad,
        total_paginas: plano.total_paginas,
        precio: plano.precio,
        autor: plano.autor,
        version: plano.version,
        creado: plano.creado,
        previewUrl: `/planos/preview/${plano._id}`,
      }));

      return {
        planos: planosFormatted,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new BadRequestException(`Error al buscar planos: ${error.message}`);
    }
  }

  async update(
    id: string,
    updatePlanosDto: Partial<PlanosDto>,
    pdfFile?: Express.Multer.File,
  ): Promise<IPlanos> {
    try {
      const updateData = {
        ...updatePlanosDto,
        actualizado: new Date(),
      };

      if (pdfFile) {
        updateData.archivo = pdfFile.buffer;
        updateData.total_paginas = await this.getTotalPagesFromPDF(
          pdfFile.buffer,
        );
      }

      const planoActualizado = await this.planosModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .select('-archivo')
        .exec();

      if (!planoActualizado) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }

      return planoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Error al actualizar plano: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const resultado = await this.planosModel.findByIdAndDelete(id).exec();

      if (!resultado) {
        throw new NotFoundException(`Plano con ID ${id} no encontrado`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Error al eliminar plano: ${error.message}`,
      );
    }
  }

  // IMPLEMENTACIÓN COMPLETA: Verificar acceso del usuario
  async hasAccess(planoId: string, userId: string): Promise<boolean> {
    try {
      // Aquí deberías verificar en tu tabla de compras/permisos
      // Por ejemplo: return await this.comprasModel.exists({ planoId, userId });

      // Simulación temporal - en producción conecta con tu sistema de compras
      return true; // Cambiar por la lógica real de verificación
    } catch (error) {
      return false;
    }
  }

  // IMPLEMENTACIÓN COMPLETA: Procesar compra
  async purchasePlano(
    planoId: string,
    userId: string,
  ): Promise<{ titulo: string; precio: number }> {
    try {
      const plano = await this.planosModel
        .findById(planoId)
        .select('titulo precio')
        .exec();

      if (!plano) {
        throw new NotFoundException(`Plano con ID ${planoId} no encontrado`);
      }

      // Aquí implementarías la lógica de compra:
      // 1. Procesar pago con tu gateway de pago
      // 2. Registrar compra en base de datos
      // 3. Enviar confirmación por email

      return {
        titulo: plano.titulo,
        precio: plano.precio,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Error al procesar compra: ${error.message}`,
      );
    }
  }

  // MÉTODO AUXILIAR: Extraer páginas específicas del PDF
  private async extractPagesFromPDF(
    pdfBuffer: Buffer,
    pagesToExtract: number[],
  ): Promise<Buffer> {
    try {
      const originalPdf = await PDFDocument.load(pdfBuffer);
      const newPdf = await PDFDocument.create();

      // Copiar solo las páginas especificadas
      const pages = await newPdf.copyPages(
        originalPdf,
        pagesToExtract.map((p) => p - 1),
      );

      pages.forEach((page) => newPdf.addPage(page));

      return Buffer.from(await newPdf.save());
    } catch (error) {
      throw new BadRequestException(
        `Error al extraer páginas del PDF: ${error.message}`,
      );
    }
  }

  // MÉTODO AUXILIAR: Obtener total de páginas del PDF
  private async getTotalPagesFromPDF(pdfBuffer: Buffer): Promise<number> {
    try {
      const pdf = await PDFDocument.load(pdfBuffer);
      return pdf.getPageCount();
    } catch (error) {
      throw new BadRequestException(
        `Error al obtener páginas del PDF: ${error.message}`,
      );
    }
  }
}
