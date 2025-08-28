interface IBGEMunicipio {
  id: number;
  nome: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// Dicionário local para mapear UF à sua capital (código IBGE)
const capitalsIBGE: { [key: string]: string } = {
  RO: '1100205', // Porto Velho
  AC: '1200401', // Rio Branco
  AM: '1302603', // Manaus
  RR: '1400100', // Boa Vista
  PA: '1501402', // Belém
  AP: '1600303', // Macapá
  TO: '1721000', // Palmas
  MA: '2111300', // São Luís
  PI: '2211001', // Teresina
  CE: '2304400', // Fortaleza
  RN: '2408102', // Natal
  PB: '2507507', // João Pessoa
  PE: '2611606', // Recife
  AL: '2704302', // Maceió
  SE: '2800308', // Aracaju
  BA: '2927408', // Salvador
  MG: '3106200', // Belo Horizonte
  ES: '3205309', // Vitória
  RJ: '3304557', // Rio de Janeiro
  SP: '3550308', // São Paulo
  PR: '4106902', // Curitiba
  SC: '4205407', // Florianópolis
  RS: '4314902', // Porto Alegre
  MS: '5002704', // Campo Grande
  MT: '5103403', // Cuiabá
  GO: '5208707', // Goiânia
  DF: '5300108', // Brasília
};

/**
 * Busca municípios de uma UF no IBGE e retorna a lista formatada
 * com a capital no topo.
 * @param uf A sigla do estado (ex: 'SP')
 * @returns Uma Promise com a lista de municípios para um dropdown.
 */
export async function getSortedMunicipalities(
  uf: string
): Promise<SelectOption[]> {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch municipalities for UF: ${uf}`);
    }

    const municipalities: IBGEMunicipio[] = await response.json();
    const capitalId = capitalsIBGE[uf];

    let capital: IBGEMunicipio | null = null;
    const otherMunicipalities: IBGEMunicipio[] = [];

    // Separa a capital dos outros municípios
    for (const m of municipalities) {
      if (capitalId && String(m.id) === capitalId) {
        capital = m;
      } else {
        otherMunicipalities.push(m);
      }
    }

    // Ordena os outros municípios em ordem alfabética
    otherMunicipalities.sort((a, b) => a.nome.localeCompare(b.nome));

    const sortedList = capital
      ? [capital, ...otherMunicipalities]
      : otherMunicipalities;

    return sortedList.map((m) => ({
      value: String(m.id),
      label: m.nome,
    }));
  } catch (error) {
    console.error(`Error fetching or sorting municipalities for ${uf}:`, error);
    // Retorna uma lista vazia em caso de erro para não quebrar a UI
    return [];
  }
}
