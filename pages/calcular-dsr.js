import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDiasUteis } from '../lib/useDiasUteis';
import { calcularDSRporPagamento } from '../lib/calculoDSRporPagamento';
import RelatorioDSRTable from '../components/RelatorioDSRTable';
import ImportHoleriteModal from '../components/ImportHoleriteModal';

// Mock data for UF and City selectors, simulating IBGE API response
const ufsMock = ['SP', 'RJ', 'MG'];
const municipiosMock = {
  SP: ['São Paulo', 'Campinas', 'Santos'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Petrópolis'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'],
};

// Mocking Shadcn UI components
const Select = ({ children, ...props }) => <select {...props}>{children}</select>;
const Checkbox = (props) => <input type="checkbox" {...props} />;
const RadioGroup = ({ children }) => <div>{children}</div>;
const RadioGroupItem = (props) => <input type="radio" {...props} />;
const Label = (props) => <label {...props} style={{ marginRight: '10px', display: 'block' }} />;
const Button = ({ children, ...props }) => <button {...props}>{children}</button>;


const initialVisibleColumns = {
  comissaoBruta: true,
  imposto: true,
  comissaoLiquida: true,
  dsr: true,
  dsrLiquido: true,
  totalBruto: true,
  totalLiquido: true,
};

const DSRCalculatorPage = () => {
  const { data: session } = useSession();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [uf, setUf] = useState('SP');
  const [municipio, setMunicipio] = useState('São Paulo');
  const [municipios, setMunicipios] = useState(municipiosMock['SP']);
  const [incluirFeriadosLocais, setIncluirFeriadosLocais] = useState(true);
  const [divisor, setDivisor] = useState('semSabado');
  const [visibleColumns, setVisibleColumns] = useState(initialVisibleColumns);
  const [pagamentos, setPagamentos] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { diasUteis, diasDescanso, loading: diasLoading, error: diasError } = useDiasUteis({
    ano, mes, uf, municipio, incluirFeriadosLocais, divisor,
  });

  useEffect(() => {
    setMunicipios(municipiosMock[uf] || []);
    setMunicipio(municipiosMock[uf]?.[0] || '');
  }, [uf]);

  useEffect(() => {
    const fetchPagamentos = async () => {
      if (!ano || !mes) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/pagamentos?ano=${ano}&mes=${mes}`);
        const data = await response.json();
        setPagamentos(data);
      } catch (error) {
        console.error('Failed to fetch pagamentos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPagamentos();
  }, [ano, mes]);

  useEffect(() => {
    if (pagamentos.length > 0 && diasUteis > 0) {
      const data = pagamentos.map(p => calcularDSRporPagamento(p, diasUteis, diasDescanso));
      setCalculatedData(data);
    } else {
      setCalculatedData([]);
    }
  }, [pagamentos, diasUteis, diasDescanso]);

  const handleColumnVisibility = (e) => {
    const { name, checked } = e.target;
    setVisibleColumns(prev => ({ ...prev, [name]: checked }));
  };

  const refreshData = () => {
      // re-fetch pagamentos
      const fetchPagamentos = async () => {
        if (!ano || !mes) return;
        setLoading(true);
        try {
          const response = await fetch(`/api/pagamentos?ano=${ano}&mes=${mes}`);
          const data = await response.json();
          setPagamentos(data);
        } catch (error) {
          console.error('Failed to fetch pagamentos', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPagamentos();
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Cálculo de DSR</h1>
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <Label htmlFor="ano">Ano</Label>
          <Select id="ano" value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="mes">Mês</Label>
          <Select id="mes" value={mes} onChange={e => setMes(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="uf">UF</Label>
          <Select id="uf" value={uf} onChange={e => setUf(e.target.value)}>
            {ufsMock.map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="municipio">Município</Label>
          <Select id="municipio" value={municipio} onChange={e => setMunicipio(e.target.value)}>
            {municipios.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div>
          <Label>
            <Checkbox checked={incluirFeriadosLocais} onChange={e => setIncluirFeriadosLocais(e.target.checked)} />
            Incluir feriados locais
          </Label>
        </div>
        <div>
          <Label>Divisor DSR</Label>
          <RadioGroup value={divisor} onValueChange={setDivisor}>
              <Label><RadioGroupItem type="radio" name="divisor" value="semSabado" checked={divisor === 'semSabado'} onChange={e => setDivisor(e.target.value)} /> Sem Sábado</Label>
              <Label><RadioGroupItem type="radio" name="divisor" value="comSabado" checked={divisor === 'comSabado'} onChange={e => setDivisor(e.target.value)} /> Com Sábado</Label>
          </RadioGroup>
        </div>
      </div>

      <div>
        <h3>Colunas Visíveis na Tabela</h3>
        {Object.keys(initialVisibleColumns).map(col => (
          <Label key={col}>
            <Checkbox name={col} checked={visibleColumns[col]} onChange={handleColumnVisibility} />
            {col}
          </Label>
        ))}
      </div>

      {session?.user?.role === 'admin' && (
        <Button onClick={() => setIsModalOpen(true)} style={{ margin: '1rem 0' }}>
          Importar Holerite
        </Button>
      )}

      <ImportHoleriteModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} onImportSuccess={refreshData} />

      <div style={{ marginTop: '2rem' }}>
        <h3>Resultados do Cálculo</h3>
        <p>Dias Úteis: {diasUteis} | Dias de Descanso: {diasDescanso}</p>
        {(loading || diasLoading) && <p>Carregando...</p>}
        {diasError && <p style={{color: 'red'}}>{diasError}</p>}
        <RelatorioDSRTable data={calculatedData} visibleColumns={visibleColumns} />
      </div>
    </div>
  );
};

export default DSRCalculatorPage;
