// Mock data simulating a database table of payments
const pagamentos = [
  {
    id: 1,
    data_prevista: '2024-07-05',
    empresa: 'Empresa A',
    tipo: 'Comissão',
    valor_bruto: 500.0,
    percentual_imposto: 15.0,
    percentual_comissao: 5.0,
    status: 'Pendente',
  },
  {
    id: 2,
    data_prevista: '2024-07-10',
    empresa: 'Empresa B',
    tipo: 'Comissão',
    valor_bruto: 1250.75,
    percentual_imposto: 18.0,
    percentual_comissao: 6.0,
    status: 'Pago',
  },
  {
    id: 3,
    data_prevista: '2024-08-05',
    empresa: 'Empresa A',
    tipo: 'Comissão',
    valor_bruto: 650.0,
    percentual_imposto: 15.0,
    percentual_comissao: 5.0,
    status: 'Pendente',
  },
  {
    id: 4,
    data_prevista: '2024-08-15',
    empresa: 'Empresa C',
    tipo: 'Bônus',
    valor_bruto: 2000.0,
    percentual_imposto: 22.0,
    percentual_comissao: 0, // Bônus não tem comissão
    status: 'Pago',
  },
  {
    id: 5,
    data_prevista: '2023-07-20',
    empresa: 'Empresa B',
    tipo: 'Comissão',
    valor_bruto: 850.5,
    percentual_imposto: 18.0,
    percentual_comissao: 6.0,
    status: 'Pago',
  },
];

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { ano, mes } = req.query; // ano: YYYY, mes: 1-12

  if (!ano || !mes) {
    return res.status(400).json({ error: 'Ano e mês são obrigatórios.' });
  }

  const anoNum = parseInt(ano, 10);
  const mesNum = parseInt(mes, 10);

  const resultados = pagamentos.filter((p) => {
    const data = new Date(p.data_prevista + 'T00:00:00'); // Fix to avoid timezone issues
    return data.getFullYear() === anoNum && data.getMonth() + 1 === mesNum;
  });

  return res.status(200).json(resultados);
}
