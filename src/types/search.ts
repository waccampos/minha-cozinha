export type ParsedSearch = {
  include: string[];
  exclude: string[];
  maxTime?: number;
  temperature?: string;
  flavor?: string;
  category?: string;
  terms: string;
};

export type SearchFilter = {
  type:
    | "Ingrediente"
    | "Exclusão"
    | "Temperatura"
    | "Perfil"
    | "Característica"
    | "Tempo"
    | "Categoria";
  value: string;
};
