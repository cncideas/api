import { Module } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CategoriaController } from './categoria.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriaSchema } from './categoria.model';

@Module({
  imports:[
    MongooseModule.forFeature([{name: 'Categoria', schema: CategoriaSchema}])
  ],
  controllers: [CategoriaController],
  providers: [CategoriaService],
})
export class CategoriaModule {}
