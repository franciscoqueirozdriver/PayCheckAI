import { useState, useEffect } from 'react';

// Mock da resposta da API de feriados, já que não temos um token real.
// Em uma aplicação real, esta seria uma chamada de rede (fetch).
const mockFeriadosAPI = async (ano, uf, municipio) => {
  console.log(`Buscando feriados para ${ano}, ${uf}, ${municipio}...`);
  // Feriados nacionais fixos
  const feriados = [
    { date: `${ano}-01-01`, name: 'Confraternização Universal' },
    { date: `${ano}-04-21`, name: 'Tiradentes' },
    { date: `${ano}-05-01`, name: 'Dia do Trabalho' },
    { date: `${ano}-09-07`, name: 'Independência do Brasil' },
    { date: `${ano}-10-12`, name: 'Nossa Senhora Aparecida' },
    { date: `${ano}-11-02`, name: 'Finados' },
    { date: `${ano}-11-15`, name: 'Proclamação da República' },
    { date: `${ano}-12-25`, name: 'Natal' },
  ];
  // Simula um feriado local para fins de teste
  if (uf === 'SP' && municipio === 'São Paulo') {
    feriados.push({ date: `${ano}-01-25`, name: 'Aniversário de São Paulo' });
  }
  // Simula um atraso de rede
  return new Promise((resolve) => setTimeout(() => resolve(feriados), 500));
};

/**
 * Hook customizado para calcular os dias úteis e de descanso em um mês.
 * @param {object} options - As opções para o cálculo.
 * @param {number} options.ano - O ano do cálculo.
 * @param {number} options.mes - O mês do cálculo (1-12).
 * @param {string} options.uf - A sigla da UF.
 * @param {string} options.municipio - O nome do município.
 * @param {boolean} options.incluirFeriadosLocais - Se deve incluir feriados locais.
 * @param {string} options.divisor - "comSabado" ou "semSabado".
 */
export const useDiasUteis = ({ ano, mes, uf, municipio, incluirFeriadosLocais, divisor }) => {
  const [diasUteis, setDiasUteis] = useState(0);
  const [diasDescanso, setDiasDescanso] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ano || !mes || !uf || !municipio) {
      setDiasUteis(0);
      setDiasDescanso(0);
      return;
    }

    const calcularDias = async () => {
      setLoading(true);
      setError(null);
      try {
        const feriadosResponse = await mockFeriadosAPI(
          ano,
          incluirFeriadosLocais ? uf : '',
          incluirFeriadosLocais ? municipio : ''
        );
        const feriadosDoMes = feriadosResponse
          .map((f) => new Date(f.date + 'T00:00:00'))
          .filter((d) => d.getUTCFullYear() === ano && d.getUTCMonth() + 1 === mes)
          .map((d) => d.getUTCDate());

        let uteis = 0;
        let descanso = 0;
        const diasNoMes = new Date(ano, mes, 0).getDate();

        for (let dia = 1; dia <= diasNoMes; dia++) {
          const dataAtual = new Date(ano, mes - 1, dia);
          const diaDaSemana = dataAtual.getDay(); // 0 = Domingo, 6 = Sábado

          if (feriadosDoMes.includes(dia)) {
            descanso++;
          } else if (diaDaSemana === 0) { // Domingo
            descanso++;
          } else if (diaDaSemana === 6 && divisor === 'semSabado') { // Sábado não é dia útil
            descanso++;
          } else {
            uteis++;
          }
        }
        setDiasUteis(uteis);
        setDiasDescanso(descanso);
      } catch (e) {
        setError('Falha ao buscar feriados.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    calcularDias();
  }, [ano, mes, uf, municipio, incluirFeriadosLocais, divisor]);

  return { diasUteis, diasDescanso, loading, error };
};
