export default function handler(req, res) {
  // This route only accepts POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Here, you would typically use a library like 'formidable' or 'multer'
  // to handle the file upload. Then, you would send the file to an
  // external OCR service.

  // For this simulation, we'll just return a mocked JSON response
  // as if the data was successfully extracted from a payslip.
  // We'll randomly pick between a couple of mock responses.

  const mockResponses = [
    {
      mes: 'Julho',
      competencia: '07/2024',
      salario_base: 2500.0,
      comissao: 1750.75,
      dsr: 350.15,
      inss: 280.5,
      irrf: 150.2,
      outros_descontos: 50.0,
      valor_bruto: 4600.9,
      valor_liquido: 4119.25,
      empresa: 'Empresa Simulada B',
    },
    {
      mes: 'Agosto',
      competencia: '08/2024',
      salario_base: 2600.0,
      comissao: 2650.0,
      dsr: 530.0,
      inss: 310.0,
      irrf: 180.5,
      outros_descontos: 75.0,
      valor_bruto: 5780.0,
      valor_liquido: 5214.5,
      empresa: 'Empresa Simulada A',
    },
  ];

  // Simulate some processing time and return a random mock response
  setTimeout(() => {
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    res.status(200).json(randomResponse);
  }, 1500); // 1.5 second delay
}
