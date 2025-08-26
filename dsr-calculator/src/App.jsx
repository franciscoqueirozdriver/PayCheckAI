import React, { useState, useEffect, useMemo } from 'react';
import ControlesCalculo from './components/ControlesCalculo.jsx';
import PagamentosForm from './components/PagamentosForm.jsx';
import RelatorioDSRTable from './components/RelatorioDSRTable.jsx';
import useDiasUteis from './hooks/useDiasUteis.js';
import { calcularDSRporPagamento } from './lib/calculoDSR.js';

export default function App() {
  const [mesAno, setMesAno] = useState('2024-08');
  const [pagamentos, setPagamentos] = useState([{ id: 1, valor_bruto: '5000,00', percentual_imposto: '10', percentual_comissao: '5' }]);
  const [usarComSabado, setUsarComSabado] = useState(true);
  const [considerarFeriados, setConsiderarFeriados] = useState(false);
  const [uf, setUf] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [ufs, setUfs] = useState([]);
  const [municipios, setMunicipios] = useState([]);

  useEffect(() => {
    async function fetchUFs() {
      try {
        const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        if (resp.ok) {
          const data = await resp.json();
          setUfs(data);
        }
      } catch (_) { /* ignore */ }
    }
    fetchUFs();
  }, []);

  useEffect(() => {
    async function fetchMunicipios() {
      if (!uf) { setMunicipios([]); return; }
      try {
        const resp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
        if (resp.ok) {
          const data = await resp.json();
          setMunicipios(data);
        }
      } catch (_) { /* ignore */ }
    }
    fetchMunicipios();
  }, [uf]);

  const dias = useDiasUteis(mesAno, considerarFeriados, uf, municipio);

  const resultados = useMemo(() => {
    return pagamentos.map(p => ({
      id: p.id,
      valorBruto: p.valor_bruto,
      ...calcularDSRporPagamento(p, {
        usarComSabado,
        diasComSabado: dias.diasComSabado,
        diasSemSabado: dias.diasSemSabado,
        diasDescanso: dias.diasDescanso
      })
    }));
  }, [pagamentos, usarComSabado, dias]);

  const totais = useMemo(() => {
    return resultados.reduce((acc, r) => {
      acc.liquidoVenda += r.liquidoVenda;
      acc.comissaoBruta += r.comissaoBruta;
      acc.comissaoLiquida += r.comissaoLiquida;
      acc.dsrBruto += r.dsrBruto;
      acc.dsrLiquido += r.dsrLiquido;
      return acc;
    }, { liquidoVenda: 0, comissaoBruta: 0, comissaoLiquida: 0, dsrBruto: 0, dsrLiquido: 0 });
  }, [resultados]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Calculadora de DSR sobre Comissões</h1>
      <ControlesCalculo
        mesAno={mesAno} setMesAno={setMesAno}
        usarComSabado={usarComSabado} setUsarComSabado={setUsarComSabado}
        considerarFeriados={considerarFeriados} setConsiderarFeriados={setConsiderarFeriados}
        uf={uf} setUf={setUf}
        municipio={municipio} setMunicipio={setMunicipio}
        ufs={ufs} municipios={municipios}
      />
      <PagamentosForm pagamentos={pagamentos} setPagamentos={setPagamentos} />
      {dias.loading ? <p>Calculando dias úteis...</p> : (
        <RelatorioDSRTable resultados={resultados} totais={totais} />
      )}
    </div>
  );
}
