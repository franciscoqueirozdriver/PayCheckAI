// Módulo de feriados: atualmente retorna array vazio.
// Estrutura pronta para integração futura com fonte oficial.

export interface FeriadosSource {
  listHolidays: (uf: string, municipio?: string) => Date[];
}

const defaultSource: FeriadosSource = {
  listHolidays: () => [],
};

export function listHolidays(uf: string, municipio?: string): Date[] {
  return defaultSource.listHolidays(uf, municipio);
}
