import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoriaDto } from './categoria.dto';
import { ICategoria } from './categoria.model';

@Injectable()
export class CategoriaService {

    constructor(@InjectModel('Categoria') private categoriaModel: Model<ICategoria>){}

    async crearCategoria (categoria: CategoriaDto): Promise <ICategoria>{
        const categoriaCreada = await this.categoriaModel.create(categoria)
        return categoriaCreada.save()
    }

    async consulartCategorias(): Promise<ICategoria[]>{
        return await this.categoriaModel.find()
    }

    
    async modificarCategoria(id:string, categoria: CategoriaDto){
        const resp = await this.categoriaModel.findByIdAndUpdate(id, categoria)
        return resp
    }

 

      // Eliminar producto
      async remove(id: string): Promise<void> {
        try {
          const resultado = await this.categoriaModel.findByIdAndDelete(id).exec();
          
          if (!resultado) {
            throw new NotFoundException(`Categoria con ID ${id} no encontrado`);
          }
        } catch (error) {
          if (error instanceof NotFoundException) throw error;
          throw new BadRequestException(`Error al eliminar categoria: ${error.message}`);
        }
      }

}
