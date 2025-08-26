import { useState, useEffect } from 'react';

export default function useDiasUteis(mesAno, considerarFeriados, uf, municipio) {
  const [state, setState] = useState({
    diasComSabado: 0,
    diasSemSabado: 0,
    diasDescanso: 0,
    loading: true,
  });

  useEffect(() => {
    const [year, month] = mesAno.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    let diasComSabado = 0;
    let diasSemSabado = 0;
    let diasDescanso = 0;

    while (date.getMonth() === month - 1) {
      const day = date.getDay();
      if (day === 0) {
        diasDescanso++;
      } else {
        diasComSabado++;
        if (day !== 6) diasSemSabado++;
      }
      date.setDate(date.getDate() + 1);
    }

    // ignoring holidays for simplicity
    setState({ diasComSabado, diasSemSabado, diasDescanso, loading: false });
  }, [mesAno, considerarFeriados, uf, municipio]);

  return state;
}
