import { useState, useEffect } from 'react';

function calcularDias(ano, mes, feriados = []) {
  const feriadosSet = new Set(feriados.map(f => f.date));
  const diasNoMes = new Date(ano, mes, 0).getDate();
  let uteisSemSabado = 0;
  let uteisComSabado = 0;
  let descanso = 0;
  for (let d = 1; d <= diasNoMes; d++) {
    const data = new Date(ano, mes - 1, d);
    const day = data.getDay();
    const dateStr = data.toISOString().split('T')[0];
    const isFeriado = feriadosSet.has(dateStr);
    if (day === 0 || isFeriado) {
      descanso += 1;
      continue;
    }
    if (day === 6) {
      uteisComSabado += 1;
    } else {
      uteisSemSabado += 1;
      uteisComSabado += 1;
    }
  }
  return { diasSemSabado: uteisSemSabado, diasComSabado: uteisComSabado, diasDescanso: descanso };
}

export default function useDiasUteis(mesAno, considerarFeriados, uf, municipio) {
  const [dados, setDados] = useState({ diasSemSabado: 0, diasComSabado: 0, diasDescanso: 0, loading: true });

  useEffect(() => {
    let isMounted = true;
    async function calcular() {
      setDados(d => ({...d, loading: true}));
      const [ano, mes] = mesAno.split('-').map(Number);
      let feriados = [];
      if (considerarFeriados && uf && municipio) {
        try {
          const resp = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
          if (resp.ok) {
            feriados = await resp.json();
          }
        } catch (_) { /* ignore */ }
      }
      const result = calcularDias(ano, mes, feriados);
      if (isMounted) setDados({...result, loading: false});
    }
    calcular();
    return () => { isMounted = false; };
  }, [mesAno, considerarFeriados, uf, municipio]);

  return dados;
}
