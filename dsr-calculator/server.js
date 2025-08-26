import path from 'node:path';
import express from 'express';

const app = express();
const distDir = path.join(process.cwd(), 'dist');

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server started on ${port}`);
});

