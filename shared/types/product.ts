interface BaseProduct {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
  price: number;
}

export interface Battery extends BaseProduct {
  category: "battery";
  capacityKwh: number;
  powerW: null;
}

export interface SolarPanel extends BaseProduct {
  category: "solar panel";
  capacityKwh: null;
  powerW: number;
}

export interface Connector extends BaseProduct {
  category: "connector";
  capacityKwh: null;
  powerW: null;
}

export type Product = Battery | SolarPanel | Connector;

export type ProductCategory = Product["category"];
