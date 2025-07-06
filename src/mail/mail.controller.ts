import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { MailService } from './mail.service';

import 'dotenv/config';
import * as dotenv from 'dotenv';

dotenv.config();

export class ContactoDto {
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
}

export class ProductoDto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria?: string;
  imagen?: string;
}

export class DatosPersonalesDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal?: string;
  pais: string;
}

export class DatosEnvioDto extends DatosPersonalesDto {
  mismoQueFacturacion: boolean;
}

export class PedidoDto {
  productos: ProductoDto[];
  datosFacturacion: DatosPersonalesDto;
  datosEnvio: DatosEnvioDto;
  metodoPago: string;
  notas?: string;
  subtotal: number;
  envio: number;
  total: number;
  fecha: string;
  id: number;
}


@Controller('api')
export class MailController {
  constructor(private readonly contactoService: MailService) {}

  @Post('contacto')
  async enviarContacto(@Body() contactoDto: ContactoDto) {
    try {
      // Validaciones básicas
      if (!contactoDto.nombre || !contactoDto.email || !contactoDto.mensaje) {
        console.log(contactoDto.nombre)
        throw new HttpException('Todos los campos son requeridos', HttpStatus.BAD_REQUEST);
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactoDto.email)) {
        throw new HttpException('El formato del email no es válido', HttpStatus.BAD_REQUEST);
      }

      // Validar formato de teléfono (números, espacios, guiones, paréntesis y el signo +)
      const telefonoRegex = /^[\+]?[0-9\s\-\(\)]+$/;
      if (!telefonoRegex.test(contactoDto.telefono)) {
        throw new HttpException('El formato del teléfono no es válido', HttpStatus.BAD_REQUEST);
      }
      
      await this.contactoService.enviarCorreo(contactoDto);
      
      return { 
        message: 'Mensaje enviado exitosamente',
        status: 'success' 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('pedido')
  async enviarPedido(@Body() pedidoDto: PedidoDto) {
    try {
      await this.contactoService.enviarCorreoPedido(pedidoDto);
      return { message: 'Pedido enviado exitosamente' };
    } catch (error) {
      return { error: 'Error al enviar el pedido' };
    }
  }
}