import { ICategoria } from "src/categoria/categoria.model";

export class ProductosDto {

    nombre:string;
    descripcion:string;
    precio: number;
    imagen: Buffer;
    categoria: ICategoria;
    caracteristicas: [string];
    cantidad: number
}