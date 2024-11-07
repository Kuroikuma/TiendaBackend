import mongoose from "mongoose";
import { IInventarioSucursal } from "../models/inventario/InventarioSucursal.model";

export interface ISubtractQuantity {
  quantity: number;
  inventarioSucursalId: mongoose.Types.ObjectId;
  session: mongoose.mongo.ClientSession;
  isNoSave: boolean;
}

export interface IInit {
  branchId: string;
  listInventarioSucursalId: string[];
  userId: string;
}

export interface IAddQuantity {
  quantity: number;
  inventarioSucursal: IInventarioSucursal;
  session: mongoose.mongo.ClientSession;
  list: IInventarioSucursal[];
  isNoSave?: boolean;
}

export interface ICreateInventarioSucursal {
  list: IInventarioSucursal[];
  inventarioSucursal: IInventarioSucursal;
  session: mongoose.mongo.ClientSession;
  isNoSave?: boolean;
}

export interface IManageHerramientaModel {
  init({ branchId, listInventarioSucursalId }: IInit): void;
}

export interface IHandleStockProductBranch {
  session: mongoose.mongo.ClientSession;
  model:IInventarioSucursal; 
  quantity:number
}