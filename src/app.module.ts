import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductosModule } from './productos/productos.module';
import { CategoriaModule } from './categoria/categoria.module';
import { PlanosModule } from './planos/planos.module';
import 'dotenv/config';
import * as dotenv from 'dotenv';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';



dotenv.config();

const URL = process.env.MONGODB ?? '';

@Module({
  imports: [
    MongooseModule.forRoot (URL),
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles en toda la app
    }),
ProductosModule, CategoriaModule, PlanosModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
