import mongoose, { SchemaTypes } from "mongoose";
import { ICategoria } from "src/categoria/categoria.model";

export const ProductosSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String,
    precio: Number,
    imagenes: [Buffer], // Cambio: Array de Buffer para múltiples imágenes
    categoria: {type: SchemaTypes.ObjectId, ref: 'Categoria' },
    caracteristicas: String,
    cantidad: Number
})

export interface IProductos extends mongoose.Document{
    nombre: string;
    descripcion: string;
    precio: number;
    imagenes: Buffer[]; // Cambio: Array de Buffer
    categoria: ICategoria;
    caracteristicas: string;
    cantidad: number
}