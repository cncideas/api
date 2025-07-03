import mongoose, { Mongoose } from "mongoose";
import { Dificultad } from "./planos.Dto";

export const PlanosSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true }, 
  categoria: { type: String, required: true },
  tipo_maquina: { type: String, required: true },

  archivo: { type: Buffer, required: true },
  preview: { type: [Number], default: [] },
  total_paginas: { type: Number, required: true },
  precio: { type: Number, required: true, min: 0 },
  descripcion_preview: { type: String, required: true },
  autor: { type: String, required: true },
  version: { type: String, default: '1.0' },
  creado: { type: Date, default: Date.now },
  actualizado: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'creado', updatedAt: 'actualizado' } // Automático
});

export interface IPlanos extends mongoose.Document {
  titulo: string;
  descripcion: string; // Corregir typo
  categoria: string;
  tipo_maquina: string;
  dificultad: Dificultad;
  archivo: Buffer;
  preview: number[];
  total_paginas: number;
  precio: number;
  descripcion_preview: string;
  autor: string;
  version: string;
  creado: Date;
  actualizado: Date;
}