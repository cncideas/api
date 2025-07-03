import { Module } from '@nestjs/common';
import { PlanosService } from './planos.service';
import { PlanosController } from './planos.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanosSchema } from './planos.Model';

@Module({
  imports : [
    MongooseModule.forFeature([{name: 'Planos', schema: PlanosSchema}])
  ],
  controllers: [PlanosController],
  providers: [PlanosService],
})
export class PlanosModule {}
