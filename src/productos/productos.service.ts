import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProductos } from './productos.model';
import { ProductosDto } from './productos.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectModel('Productos') private readonly productosModel: Model<IProductos>,
  ) {}

  // Crear producto con múltiples imágenes
  async create(productosDto: ProductosDto, imageFiles?: Express.Multer.File[]): Promise<IProductos> {
    try {
      const productData = {
        ...productosDto,
        imagenes: imageFiles ? imageFiles.map(file => file.buffer) : [],
      };

      const nuevoProducto = new this.productosModel(productData);
      return await nuevoProducto.save();
    } catch (error) {
      throw new BadRequestException(`Error al crear producto: ${error.message}`);
    }
  }

  // Obtener todos los productos (sin incluir las imágenes para optimizar)
  async findAll(): Promise<IProductos[]> {
    try {
      return await this.productosModel
        .find()
        .select('-imagenes') // Excluir imágenes para optimizar la consulta
        .populate('categoria')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al obtener productos: ${error.message}`);
    }
  }

  // Obtener todos los productos con imágenes (para casos específicos)
  async findAllWithImages(): Promise<IProductos[]> {
    try {
      return await this.productosModel
        .find()
        .populate('categoria')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al obtener productos con imágenes: ${error.message}`);
    }
  }

  // Método optimizado para el frontend - convierte imágenes a base64
  async findAllForFrontend(): Promise<any[]> {
    try {
      const productos = await this.productosModel
        .find()
        .populate('categoria')
        .exec();

      return productos.map(producto => ({
        _id: producto._id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        caracteristicas: producto.caracteristicas,
        cantidad: producto.cantidad,
        imagenes: producto.imagenes ? producto.imagenes.map(imagen => 
          `data:image/jpeg;base64,${imagen.toString('base64')}`
        ) : [],
      }));
    } catch (error) {
      throw new BadRequestException(`Error al obtener productos para frontend: ${error.message}`);
    }
  }

  // Método paginado para el frontend con imágenes en base64
  async findForFrontendPaginated(page: number = 1, limit: number = 10): Promise<{
    productos: any[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [productos, total] = await Promise.all([
        this.productosModel
          .find()
          .populate('categoria')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productosModel.countDocuments().exec(),
      ]);

      const productosConImagenes = productos.map(producto => ({
        _id: producto._id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        caracteristicas: producto.caracteristicas,
        cantidad: producto.cantidad,
        imagenes: producto.imagenes ? producto.imagenes.map(imagen => 
          `data:image/jpeg;base64,${imagen.toString('base64')}`
        ) : [],
      }));

      return {
        productos: productosConImagenes,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener productos paginados para frontend: ${error.message}`);
    }
  }

  // Obtener producto por ID (ahora siempre con imágenes en base64 para consistencia)
  async findOne(id: string): Promise<any> {
    try {
      const producto = await this.productosModel
        .findById(id)
        .populate('categoria')
        .exec();

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return {
        _id: producto._id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        caracteristicas: producto.caracteristicas,
        cantidad: producto.cantidad,
        imagenes: producto.imagenes ? producto.imagenes.map(imagen => 
          `data:image/jpeg;base64,${imagen.toString('base64')}`
        ) : [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener producto: ${error.message}`);
    }
  }

  // Obtener producto por ID con imágenes
  async findOneWithImages(id: string): Promise<IProductos> {
    try {
      const producto = await this.productosModel
        .findById(id)
        .populate('categoria')
        .exec();

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return producto;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener producto con imágenes: ${error.message}`);
    }
  }

  // Obtener imagen específica de un producto por índice
  async getProductImage(id: string, index: number): Promise<Buffer> {
    try {
      const producto = await this.productosModel
        .findById(id)
        .select('imagenes')
        .exec();

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      if (!producto.imagenes || producto.imagenes.length === 0) {
        throw new NotFoundException(`El producto no tiene imágenes`);
      }

      if (index >= producto.imagenes.length) {
        throw new NotFoundException(`Índice de imagen ${index} fuera de rango`);
      }

      return producto.imagenes[index];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener imagen: ${error.message}`);
    }
  }

  // Obtener todas las imágenes de un producto en base64
  async getAllProductImages(id: string): Promise<string[]> {
    try {
      const producto = await this.productosModel
        .findById(id)
        .select('imagenes')
        .exec();

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return producto.imagenes ? producto.imagenes.map(imagen => 
        `data:image/jpeg;base64,${imagen.toString('base64')}`
      ) : [];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener imágenes: ${error.message}`);
    }
  }

  // Actualizar producto
  async update(id: string, updateProductosDto: Partial<ProductosDto>, imageFiles?: Express.Multer.File[]): Promise<IProductos> {
    try {
      const updateData = { ...updateProductosDto };
      
      // Si se proporcionan nuevas imágenes, reemplazar las existentes
      if (imageFiles && imageFiles.length > 0) {
        updateData.imagenes = imageFiles.map(file => file.buffer);
      }

      const productoActualizado = await this.productosModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('categoria')
        .exec();

      if (!productoActualizado) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return productoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al actualizar producto: ${error.message}`);
    }
  }

  // Agregar nuevas imágenes sin reemplazar las existentes
  async addImages(id: string, imageFiles: Express.Multer.File[]): Promise<IProductos | null> {
    try {
      const producto = await this.productosModel.findById(id).exec();
      
      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      const nuevasImagenes = imageFiles.map(file => file.buffer);
      const imagenesActualizadas = [...(producto.imagenes || []), ...nuevasImagenes];

      const productoActualizado = await this.productosModel
        .findByIdAndUpdate(
          id, 
          { imagenes: imagenesActualizadas }, 
          { new: true }
        )
        .populate('categoria')
        .exec();

      return productoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al agregar imágenes: ${error.message}`);
    }
  }

  // Reemplazar todas las imágenes
  async replaceAllImages(id: string, imageFiles: Express.Multer.File[]): Promise<IProductos> {
    try {
      const nuevasImagenes = imageFiles.map(file => file.buffer);
      
      const productoActualizado = await this.productosModel
        .findByIdAndUpdate(
          id, 
          { imagenes: nuevasImagenes }, 
          { new: true }
        )
        .populate('categoria')
        .exec();

      if (!productoActualizado) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return productoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al reemplazar imágenes: ${error.message}`);
    }
  }

  // Eliminar una imagen específica por índice
  async removeImage(id: string, index: number): Promise<IProductos | null> {
    try {
      const producto = await this.productosModel.findById(id).exec();
      
      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      if (!producto.imagenes || producto.imagenes.length === 0) {
        throw new NotFoundException(`El producto no tiene imágenes`);
      }

      if (index >= producto.imagenes.length) {
        throw new NotFoundException(`Índice de imagen ${index} fuera de rango`);
      }

      const imagenesActualizadas = producto.imagenes.filter((_, i) => i !== index);

      const productoActualizado = await this.productosModel
        .findByIdAndUpdate(
          id, 
          { imagenes: imagenesActualizadas }, 
          { new: true }
        )
        .populate('categoria')
        .exec();

      return productoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al eliminar imagen: ${error.message}`);
    }
  }

  // Eliminar todas las imágenes de un producto
  async removeAllImages(id: string): Promise<IProductos> {
    try {
      const productoActualizado = await this.productosModel
        .findByIdAndUpdate(
          id, 
          { imagenes: [] }, 
          { new: true }
        )
        .populate('categoria')
        .exec();

      if (!productoActualizado) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return productoActualizado;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al eliminar imágenes: ${error.message}`);
    }
  }

  // Eliminar producto
  async remove(id: string): Promise<void> {
    try {
      const resultado = await this.productosModel.findByIdAndDelete(id).exec();
      
      if (!resultado) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al eliminar producto: ${error.message}`);
    }
  }

  // Buscar productos por nombre
  async findByName(nombre: string): Promise<IProductos[]> {
    try {
      return await this.productosModel
        .find({ nombre: { $regex: nombre, $options: 'i' } })
        .select('-imagenes')
        .populate('categoria')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al buscar productos: ${error.message}`);
    }
  }

  // Buscar productos por categoría
  async findByCategory(categoriaId: string): Promise<IProductos[]> {
    try {
      return await this.productosModel
        .find({ categoria: categoriaId })
        .select('-imagenes')
        .populate('categoria')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error al buscar productos por categoría: ${error.message}`);
    }
  }

  // Obtener productos con paginación
  async findWithPagination(page: number = 1, limit: number = 10): Promise<{
    productos: IProductos[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [productos, total] = await Promise.all([
        this.productosModel
          .find()
          .select('-imagenes')
          .populate('categoria')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.productosModel.countDocuments().exec(),
      ]);

      return {
        productos,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new BadRequestException(`Error al obtener productos paginados: ${error.message}`);
    }
  }
}