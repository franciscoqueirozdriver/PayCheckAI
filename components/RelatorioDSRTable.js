import React from 'react';
// Mocking Shadcn UI component imports since I can't install them.
// In a real project, these would be imported from '@/components/ui/table'.
const Table = ({ children, ...props }) => <table {...props}>{children}</table>;
const TableHeader = ({ children, ...props }) => <thead {...props}>{children}</thead>;
const TableBody = ({ children, ...props }) => <tbody {...props}>{children}</tbody>;
const TableFooter = ({ children, ...props }) => <tfoot {...props}>{children}</tfoot>;
const TableRow = ({ children, ...props }) => <tr {...props}>{children}</tr>;
const TableHead = ({ children, ...props }) => <th {...props}>{children}</th>;
const TableCell = ({ children, ...props }) => <td {...props}>{children}</td>;
const TableCaption = ({ children, ...props }) => <caption {...props}>{children}</caption>;


const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) return 'R$ 0,00';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const RelatorioDSRTable = ({
  data = [],
  visibleColumns = {},
  ocultarData = false,
  ocultarStatus = false,
  ocultarTipo = false,
}) => {
  const totais = data.reduce(
    (acc, row) => {
      acc.comissaoBruta += parseFloat(row.comissaoBruta || 0);
      acc.imposto += parseFloat(row.imposto || 0);
      acc.comissaoLiquida += parseFloat(row.comissaoLiquida || 0);
      acc.dsr += parseFloat(row.dsr || 0);
      acc.dsrLiquido += parseFloat(row.dsrLiquido || 0);
      acc.totalBruto += parseFloat(row.totalBruto || 0);
      acc.totalLiquido += parseFloat(row.totalLiquido || 0);
      return acc;
    },
    {
      comissaoBruta: 0,
      imposto: 0,
      comissaoLiquida: 0,
      dsr: 0,
      dsrLiquido: 0,
      totalBruto: 0,
      totalLiquido: 0,
    }
  );

  const columns = [
    { key: 'empresa', label: 'Empresa', visible: !ocultarStatus },
    { key: 'data_prevista', label: 'Data Prevista', visible: !ocultarData },
    { key: 'tipo', label: 'Tipo', visible: !ocultarTipo },
    { key: 'status', label: 'Status', visible: !ocultarStatus },
    { key: 'comissaoBruta', label: 'Comissão Bruta', visible: visibleColumns.comissaoBruta, isCurrency: true },
    { key: 'imposto', label: 'Imposto', visible: visibleColumns.imposto, isCurrency: true },
    { key: 'comissaoLiquida', label: 'Comissão Líquida', visible: visibleColumns.comissaoLiquida, isCurrency: true },
    { key: 'dsr', label: 'DSR', visible: visibleColumns.dsr, isCurrency: true },
    { key: 'dsrLiquido', label: 'DSR Líquido', visible: visibleColumns.dsrLiquido, isCurrency: true },
    { key: 'totalBruto', label: 'Total Bruto', visible: visibleColumns.totalBruto, isCurrency: true },
    { key: 'totalLiquido', label: 'Total Líquido', visible: visibleColumns.totalLiquido, isCurrency: true },
  ];

  const activeColumns = columns.filter(c => c.visible);

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableCaption>Relatório de cálculo de DSR.</TableCaption>
        <TableHeader>
          <TableRow>
            {activeColumns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row) => (
              <TableRow key={row.id}>
                {activeColumns.map((col) => (
                  <TableCell key={col.key}>
                    {col.isCurrency ? formatCurrency(row[col.key]) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={activeColumns.length} className="text-center">
                Nenhum dado disponível.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={activeColumns.findIndex(c => c.isCurrency)} >
              <span className="font-bold">TOTAIS</span>
            </TableCell>
            {activeColumns.slice(activeColumns.findIndex(c => c.isCurrency)).map(col => (
              <TableCell key={col.key} className="font-bold">
                {col.isCurrency ? formatCurrency(totais[col.key]) : ''}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default RelatorioDSRTable;
