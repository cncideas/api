import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CategoriaDto } from './categoria.dto';

@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  async creando(@Body() categoria: CategoriaDto){
    const catCreada= await this.categoriaService.crearCategoria(categoria)
    return {ok:true, catCreada}

  }

  @Get()
  async consultando(){
    return await this.categoriaService.consulartCategorias()
  }

  @Patch(':id')
  async editar(@Param('id') id: string, @Body() categoria: CategoriaDto){
    return await this.categoriaService.modificarCategoria(id, categoria)
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string){
    return this.categoriaService.remove(id)
  }
}
