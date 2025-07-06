import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ContactoDto, PedidoDto } from './mail.controller';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Tu email de Gmail
        pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación de Gmail
      },
    });
  }

  async enviarCorreo(contactoDto: ContactoDto) {
    const { nombre, email, mensaje, telefono } = contactoDto;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Tu email donde recibirás los mensajes
      subject: `Nuevo mensaje desde CNC IDEAS - APP - ${nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="./logo.png"> </img>
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Nuevo mensaje de contacto a traves de CNC IDEAS - APP
          </h2>

          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Datos del contacto:</h3>
            <p><strong>Nombre:</strong> ${nombre}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${telefono}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Mensaje:</h3>
            <p style="line-height: 1.6; color: #374151;">${mensaje}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>Este mensaje fue enviado desde el formulario de contacto de tu sitio web CNC Ideas.</p>
            <p>Fecha: ${new Date().toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado exitosamente');
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw new Error('Error al enviar el correo');
    }
  }

  async enviarCorreoPedido(pedidoDto: PedidoDto) {
    const { 
      productos, 
      datosFacturacion, 
      datosEnvio, 
      metodoPago, 
      notas, 
      subtotal, 
      envio, 
      total, 
      fecha, 
      id 
    } = pedidoDto;

    // Generar HTML para los productos
    const productosHtml = productos.map(producto => {
      const esPlano = producto.categoria && (
        producto.categoria.toLowerCase().includes('plano') ||
        producto.categoria.toLowerCase().includes('pdf') ||
        producto.categoria.toLowerCase().includes('cnc') ||
        producto.categoria.toLowerCase().includes('diseño')
      );
      
      const icono = esPlano ? '📄' : '📦';
      
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; border-right: 1px solid #e5e7eb;">
            ${icono} ${producto.nombre}
            <br><small style="color: #6b7280;">${producto.categoria || 'Producto'}</small>
          </td>
          <td style="padding: 12px; text-align: center; border-right: 1px solid #e5e7eb;">${producto.cantidad}</td>
          <td style="padding: 12px; text-align: right; border-right: 1px solid #e5e7eb;">
            ${this.formatearPrecio(producto.precio)}
          </td>
          <td style="padding: 12px; text-align: right;">
            ${this.formatearPrecio(producto.precio * producto.cantidad)}
          </td>
        </tr>
      `;
    }).join('');

    // Obtener método de pago formateado
    const metodoPagoFormateado = this.formatearMetodoPago(metodoPago);

    // Determinar datos de envío
    const datosEnvioFinales = datosEnvio.mismoQueFacturacion ? datosFacturacion : datosEnvio;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Tu email donde recibirás los pedidos
      subject: `🛒 NUEVO PEDIDO #${id} - ${datosFacturacion.nombre} ${datosFacturacion.apellido}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8fafc;">
          <!-- Header -->
          <div style="background-color: #2563eb; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🛒 NUEVO PEDIDO RECIBIDO</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Pedido #${id}</p>
          </div>

          <!-- Contenido principal -->
          <div style="padding: 30px; background-color: white; margin: 0 20px;">
            
            <!-- Información del cliente -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
                👤 DATOS DEL CLIENTE
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
                  <h3 style="color: #2563eb; margin-top: 0;">Facturación</h3>
                  <p style="margin: 5px 0;"><strong>Nombre:</strong> ${datosFacturacion.nombre} ${datosFacturacion.apellido}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${datosFacturacion.email}</p>
                  <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${datosFacturacion.telefono}</p>
                  <p style="margin: 5px 0;"><strong>Dirección:</strong> ${datosFacturacion.direccion}</p>
                  <p style="margin: 5px 0;"><strong>Ciudad:</strong> ${datosFacturacion.ciudad}</p>
                  <p style="margin: 5px 0;"><strong>País:</strong> ${datosFacturacion.pais}</p>
                  ${datosFacturacion.codigoPostal ? `<p style="margin: 5px 0;"><strong>Código Postal:</strong> ${datosFacturacion.codigoPostal}</p>` : ''}
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
                  <h3 style="color: #2563eb; margin-top: 0;">Envío</h3>
                  ${datosEnvio.mismoQueFacturacion ? 
                    '<p style="font-style: italic; color: #6b7280;">Misma dirección de facturación</p>' : 
                    `
                    <p style="margin: 5px 0;"><strong>Nombre:</strong> ${datosEnvioFinales.nombre} ${datosEnvioFinales.apellido}</p>
                    <p style="margin: 5px 0;"><strong>Dirección:</strong> ${datosEnvioFinales.direccion}</p>
                    <p style="margin: 5px 0;"><strong>Ciudad:</strong> ${datosEnvioFinales.ciudad}</p>
                    <p style="margin: 5px 0;"><strong>País:</strong> ${datosEnvioFinales.pais}</p>
                    ${datosEnvioFinales.codigoPostal ? `<p style="margin: 5px 0;"><strong>Código Postal:</strong> ${datosEnvioFinales.codigoPostal}</p>` : ''}
                    `
                  }
                </div>
              </div>
            </div>

            <!-- Productos -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
                📦 PRODUCTOS PEDIDOS
              </h2>
              <table style="width: 100%; border-collapse: collapse; background-color: white; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 15px; text-align: left; border-right: 1px solid #e5e7eb;">Producto</th>
                    <th style="padding: 15px; text-align: center; border-right: 1px solid #e5e7eb;">Cantidad</th>
                    <th style="padding: 15px; text-align: right; border-right: 1px solid #e5e7eb;">Precio Unit.</th>
                    <th style="padding: 15px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosHtml}
                </tbody>
              </table>
            </div>

            <!-- Resumen de costos -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
                💰 RESUMEN DE COSTOS
              </h2>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Subtotal:</span>
                  <span>${this.formatearPrecio(subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Envío:</span>
                  <span>${envio === 0 ? 'Sujeto a operador' : this.formatearPrecio(envio)}</span>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #2563eb;">
                  <span>TOTAL:</span>
                  <span>${this.formatearPrecio(total)}</span>
                </div>
              </div>
            </div>

            <!-- Información de pago -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
                💳 MÉTODO DE PAGO
              </h2>
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #2563eb;">
                  ${metodoPagoFormateado}
                </p>
              </div>
            </div>

            <!-- Notas -->
            ${notas ? `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">
                📝 NOTAS ADICIONALES
              </h2>
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; line-height: 1.6; color: #92400e;">${notas}</p>
              </div>
            </div>
            ` : ''}

            <!-- Llamada a la acción -->
            <div style="background-color: #2563eb; color: white; padding: 25px; border-radius: 8px; text-align: center; margin-top: 30px;">
              <h3 style="margin: 0 0 15px 0;">⚡ ACCIÓN REQUERIDA</h3>
              <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                Contacta al cliente lo antes posible para confirmar el pedido y coordinar el pago y envío.
              </p>
              <div style="margin-top: 20px;">
                <a href="mailto:${datosFacturacion.email}" style="background-color: white; color: #2563eb; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                  📧 Enviar Email
                </a>
                <a href="tel:${datosFacturacion.telefono}" style="background-color: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  📞 Llamar
                </a>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Pedido realizado el ${new Date(fecha).toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p style="margin: 5px 0 0 0;">CNC IDEAS - Sistema de Pedidos</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Correo de pedido enviado exitosamente');
    } catch (error) {
      console.error('Error al enviar correo de pedido:', error);
      throw new Error('Error al enviar el correo del pedido');
    }
  }

  private formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  private formatearMetodoPago(metodoPago: string): string {
    const metodos = {
      'transferencia': '💳 Transferencia Bancaria',
      'efectivo': '💵 Efectivo (Contra entrega)',
      'nequi': '📱 Nequi'
    };
    return metodos[metodoPago] || metodoPago;
  }
}