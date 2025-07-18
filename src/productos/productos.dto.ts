import { ICategoria } from "src/categoria/categoria.model";

export class ProductosDto {
    nombre: string;
    descripcion: string;
    precio: number;
    imagenes: Buffer[]; // Cambio: Array de Buffer para múltiples imágenes
    categoria: ICategoria;
    caracteristicas: string;
    cantidad: number
}