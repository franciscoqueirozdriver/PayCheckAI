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
  RO: '1100205', AC: '1200401', AM: '1302603', RR: '1400100', PA: '1501402',
  AP: '1600303', TO: '1721000', MA: '2111300', PI: '2211001', CE: '2304400',
  RN: '2408102', PB: '2507507', PE: '2611606', AL: '2704302', SE: '2800308',
  BA: '2927408', MG: '3106200', ES: '3205309', RJ: '3304557', SP: '3550308',
  PR: '4106902', SC: '4205407', RS: '4314902', MS: '5002704', MT: '5103403',
  GO: '5208707', DF: '5300108',
};

/**
 * Busca municípios de uma UF e move a capital para o topo.
 * @param uf A sigla do estado (ex: 'SP')
 * @returns Uma Promise com a lista de municípios formatada para um dropdown.
 */
export async function getMunicipalitiesSorted(uf: string): Promise<SelectOption[]> {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
      { next: { revalidate: 86400 } } // Cache de 1 dia
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch municipalities for UF: ${uf}`);
    }

    const municipalities: IBGEMunicipio[] = await response.json();
    const capitalId = capitalsIBGE[uf];

    if (!capitalId) {
      // Se não houver capital no nosso mapa, retorna a lista apenas ordenada alfabeticamente
      municipalities.sort((a, b) => a.nome.localeCompare(b.nome));
      return municipalities.map((m) => ({ value: String(m.id), label: m.nome }));
    }

    let capital: IBGEMunicipio | null = null;
    const otherMunicipalities: IBGEMunicipio[] = [];

    for (const m of municipalities) {
      if (String(m.id) === capitalId) {
        capital = m;
      } else {
        otherMunicipalities.push(m);
      }
    }

    otherMunicipalities.sort((a, b) => a.nome.localeCompare(b.nome));

    const sortedList = capital ? [capital, ...otherMunicipalities] : otherMunicipalities;

    return sortedList.map((m) => ({
      value: String(m.id),
      label: m.nome,
    }));

  } catch (error) {
    console.error(`Error fetching or sorting municipalities for ${uf}:`, error);
    return [];
  }
}
