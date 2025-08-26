import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { calcularDSRporPagamento } from '../../lib/calculoDSRporPagamento';
import { useDiasUteis } from '../../lib/useDiasUteis';
import RelatorioDSRTable from '../../components/RelatorioDSRTable';

// Mocking Shadcn UI components
const Button = ({ children, ...props }) => <button {...props}>{children}</button>;

// Default columns for this report page. Note that the component will hide some based on props.
const visibleColumns = {
  comissaoBruta: true,
  imposto: true,
  comissaoLiquida: true,
  dsr: true,
  dsrLiquido: true,
  totalBruto: true,
  totalLiquido: true,
};

const RelatorioDSRPage = () => {
  // `required: true` will redirect to signin page if not authenticated
  const { data: session, status } = useSession({ required: true });
  const [calculatedData, setCalculatedData] = useState([]);
  const [loading, setLoading] = useState(true);

  // For simplicity, this report uses current month/year and a default location
  const ano = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;
  const { diasUteis, diasDescanso } = useDiasUteis({
    ano,
    mes,
    uf: 'SP', // Default location for the consolidated report
    municipio: 'São Paulo',
    incluirFeriadosLocais: true,
    divisor: 'semSabado',
  });

  useEffect(() => {
    const fetchDataAndCalculate = async () => {
      if (diasUteis > 0) {
        try {
          const response = await fetch(`/api/pagamentos?ano=${ano}&mes=${mes}`);
          const pagamentos = await response.json();
          const data = pagamentos.map(p => calcularDSRporPagamento(p, diasUteis, diasDescanso));
          setCalculatedData(data);
        } catch (error) {
          console.error('Failed to fetch data for report', error);
        } finally {
          setLoading(false);
        }
      }
    };

    // Only run calculation if we have the day counts
    if (diasUteis > 0) {
        fetchDataAndCalculate();
    }
    // if diasUteis is still 0, the hook might still be running.
    // The dependency array handles re-running this effect when it's ready.

  }, [diasUteis, diasDescanso, ano, mes]);

  const handlePrint = () => {
    window.print();
  };

  // While session is loading, show nothing or a loader
  if (status === 'loading' || loading) {
    return <p>Carregando...</p>;
  }

  // After loading, if user is not an admin, deny access
  if (session.user.role !== 'admin') {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Acesso Negado</h1>
        <p>Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  // If we reach here, user is an admin
  return (
    <div style={{ padding: '2rem' }}>
      <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Relatório Consolidado de DSR</h1>
        <Button onClick={handlePrint}>Imprimir / Salvar PDF</Button>
      </div>
      <p>Este é o relatório consolidado para o mês de {mes}/{ano}.</p>
      <div style={{ marginTop: '2rem' }}>
        <RelatorioDSRTable
          data={calculatedData}
          visibleColumns={visibleColumns}
          ocultarData={true}
          ocultarStatus={true}
          ocultarTipo={true}
        />
      </div>
    </div>
  );
};

export default RelatorioDSRPage;
