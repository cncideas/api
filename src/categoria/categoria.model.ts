import mongoose from "mongoose";

export const CategoriaSchema = new mongoose.Schema(
    {
        nombre:  { type: String, required: true, unique: true }
    }
)

export interface ICategoria extends mongoose.Document{
    nombre:string
}