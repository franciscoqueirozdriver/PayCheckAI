
import React from 'react';

export default function ControlesCalculo({
  mesAno,
  setMesAno,
  usarComSabado,
  setUsarComSabado,
  considerarFeriados,
  setConsiderarFeriados,
  uf,
  setUf,
  municipio,
  setMunicipio,
  ufs,
  municipios,
}) {
  return (
    <div className="space-y-4 mb-4">
      <div className="flex space-x-4 items-center">
        <label className="flex flex-col">
          Mês/Ano
          <input
            type="month"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="border p-1 rounded"
          />
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={usarComSabado}
            onChange={(e) => setUsarComSabado(e.target.checked)}
          />
          <span>Divisor com Sábado</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={considerarFeriados}
            onChange={(e) => setConsiderarFeriados(e.target.checked)}
          />
          <span>Considerar Feriados</span>
        </label>
      </div>
      <div className="flex space-x-4">
        <label className="flex flex-col">
          UF
          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="">Selecione</option>
            {ufs.map((u) => (
              <option key={u.id} value={u.sigla}>
                {u.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col flex-1">
          Município
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="">Selecione</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.nome}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
