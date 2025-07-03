
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProductos } from './productos.model';
import { ProductosDto } from './productos.dto';
import { Multer } from 'multer';

@Injectable()
export class ProductosService {
  constructor(
    @InjectModel('Productos') private readonly productosModel: Model<IProductos>,
  ) {}

  // Crear producto con imagen
  async create(productosDto: ProductosDto, imageFile?:Express.Multer.File): Promise<IProductos> {
    try {
      const productData = {
        ...productosDto,
        imagen: imageFile ? imageFile.buffer : null,
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
        .select('-imagen') // Excluir imagen para optimizar la consulta
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
        imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
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
        imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
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

 // Obtener producto por ID (ahora siempre con imagen en base64 para consistencia)
async findOne(id: string): Promise<any> {
  try {
    const producto = await this.productosModel
      .findById(id)
      .populate('categoria')
      .exec();

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Devolver en el mismo formato que findAllForFrontend para consistencia
    return {
      _id: producto._id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      caracteristicas: producto.caracteristicas,
      cantidad: producto.cantidad,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
    };
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    throw new BadRequestException(`Error al obtener producto: ${error.message}`);
  }
}
  // Obtener producto por ID con imagen
  async findOneWithImage(id: string): Promise<IProductos> {
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
      throw new BadRequestException(`Error al obtener producto con imagen: ${error.message}`);
    }
  }

  // Obtener solo la imagen de un producto
  async getProductImage(id: string): Promise<Buffer> {
    try {
      const producto = await this.productosModel
        .findById(id)
        .select('imagen')
        .exec();

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      if (!producto.imagen) {
        throw new NotFoundException(`El producto no tiene imagen`);
      }

      return producto.imagen;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener imagen: ${error.message}`);
    }
  }

  // Actualizar producto
  async update(id: string, updateProductosDto: Partial<ProductosDto>, imageFile?:Express.Multer.File): Promise<IProductos> {
    try {
      const updateData = { ...updateProductosDto };
      
      // Si se proporciona una nueva imagen, agregarla a los datos de actualización
      if (imageFile) {
        updateData.imagen = imageFile.buffer;
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

  // Actualizar solo la imagen
  async updateImage(id: string, imageFile:Express.Multer.File): Promise<IProductos> {
    try {
      const productoActualizado = await this.productosModel
        .findByIdAndUpdate(
          id, 
          { imagen: imageFile.buffer }, 
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
      throw new BadRequestException(`Error al actualizar imagen: ${error.message}`);
    }
  }

  // Eliminar imagen de un producto
  async removeImage(id: string): Promise<IProductos> {
    try {
      const productoActualizado = await this.productosModel
        .findByIdAndUpdate(
          id, 
          { $unset: { imagen: 1 } }, 
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
      throw new BadRequestException(`Error al eliminar imagen: ${error.message}`);
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
        .select('-imagen')
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
        .select('-imagen')
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
          .select('-imagen')
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