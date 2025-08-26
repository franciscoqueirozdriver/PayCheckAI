// In-memory array to act as a simple database for holerites
let holeritesDb = [];

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const holeriteData = req.body;

  if (!holeriteData || Object.keys(holeriteData).length === 0) {
    return res.status(400).json({ error: 'Corpo da requisição não pode ser vazio.' });
  }

  // Assign a simple ID and a timestamp
  const novoHolerite = {
    id: holeritesDb.length + 1,
    ...holeriteData,
    salvoEm: new Date().toISOString(),
  };

  holeritesDb.push(novoHolerite);

  // Optional: You can log the "database" to see the stored data
  console.log('Holerites no DB:', holeritesDb);

  return res.status(201).json(novoHolerite);
}
