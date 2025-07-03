export enum Dificultad {
  Basico = 'BASICO',
  Intermedio = 'INTERMEDIO',
  Avanzado = 'AVANZADO'
}


export class PlanosDto {

 titulo: string;
  descripcion: string;
  categoria: string;
  tipo_maquina: string;
  dificultad: Dificultad;
  archivo: Buffer;
  preview: number[]; // ej: [1, 3, 5] = páginas 1, 3 y 5
  total_paginas: number;
  precio: number;
  descripcion_preview: string;
  autor: string;
  version: string;
  creado: Date;
  actualizado: Date;

}