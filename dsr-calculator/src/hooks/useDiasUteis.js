import { useEffect, useState } from 'react';

export default function useDiasUteis(mesAno) {
  const [state, setState] = useState({
    diasComSabado: 0,
    diasSemSabado: 0,
    diasDescanso: 0,
    loading: true
  });

  useEffect(() => {
    const date = new Date(mesAno + '-01');
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const diasDescanso = 4; // simplificação para exemplo
    const diasComSabado = daysInMonth - diasDescanso;
    const diasSemSabado = diasComSabado - 4;
    setState({ diasComSabado, diasSemSabado, diasDescanso, loading: false });
  }, [mesAno]);

  return state;
}

