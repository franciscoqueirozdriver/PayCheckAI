import React, { useState, useEffect } from 'react';

// Define interfaces for the data from IBGE API
interface UF {
  id: number;
  sigla: string;
  nome: string;
}

interface Municipio {
  id: number;
  nome: string;
}

interface ConfigurationPanelProps {
  mesAno: string;
  setMesAno: (value: string) => void;
  usarComSabado: boolean;
  setUsarComSabado: (value: boolean) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  mesAno,
  setMesAno,
  usarComSabado,
  setUsarComSabado
}) => {
  const [ufs, setUfs] = useState<UF[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [selectedUf, setSelectedUf] = useState('');
  const [isLoadingUfs, setIsLoadingUfs] = useState(true);
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);

  // Fetch UFs from IBGE API on component mount
  useEffect(() => {
    setIsLoadingUfs(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => response.json())
      .then(data => setUfs(data))
      .catch(error => console.error("Failed to fetch UFs:", error))
      .finally(() => setIsLoadingUfs(false));
  }, []);

  // Fetch municipios when selectedUf changes
  useEffect(() => {
    if (selectedUf) {
      setIsLoadingMunicipios(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(response => response.json())
        .then(data => setMunicipios(data))
        .catch(error => console.error("Failed to fetch municipios:", error))
        .finally(() => setIsLoadingMunicipios(false));
    } else {
      setMunicipios([]);
    }
  }, [selectedUf]);

  return (
    <section className="bg-white p-6 rounded-lg shadow-lg space-y-6">
      <h2 className="text-2xl font-semibold text-gray-700">Configurações do Cálculo</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mesAno" className="block text-sm font-medium text-gray-600">Mês de Referência</label>
          <input
            type="month"
            id="mesAno"
            value={mesAno}
            onChange={(e) => setMesAno(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md shadow-sm"
          />
        </div>
        <div className="flex items-end pb-1">
            <label className="flex items-center space-x-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={usarComSabado}
                    onChange={(e) => setUsarComSabado(e.target.checked)}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">Considerar Sábado?</span>
            </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Localidade (para Feriados Futuros)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="uf" className="block text-sm font-medium text-gray-600">Estado (UF)</label>
                <select
                    id="uf"
                    value={selectedUf}
                    onChange={(e) => setSelectedUf(e.target.value)}
                    className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white"
                    disabled={isLoadingUfs}
                >
                    <option value="">{isLoadingUfs ? 'Carregando...' : 'Selecione um estado'}</option>
                    {ufs.map(uf => <option key={uf.id} value={uf.sigla}>{uf.nome}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="municipio" className="block text-sm font-medium text-gray-600">Município</label>
                <select
                    id="municipio"
                    disabled={!selectedUf || municipios.length === 0 || isLoadingMunicipios}
                    className="mt-1 w-full p-2 border rounded-md shadow-sm bg-white disabled:bg-gray-100"
                >
                    <option value="">{isLoadingMunicipios ? 'Carregando...' : 'Selecione um município'}</option>
                    {municipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                </select>
            </div>
        </div>
      </div>
    </section>
  );
};

export default ConfigurationPanel;
