import { TextractClient, AnalyzeDocumentCommand, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand, Block, AnalyzeDocumentCommandOutput, StartDocumentAnalysisCommandOutput } from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const FIVE_MB = 5 * 1024 * 1024;

function buildClient() {
  return new TextractClient({ region: process.env.AWS_REGION });
}

function buildS3() {
  return new S3Client({ region: process.env.AWS_REGION });
}

function getBlockMap(blocks: Block[] = []): Map<string, Block> {
  const map = new Map<string, Block>();
  for (const b of blocks) if (b.Id) map.set(b.Id, b);
  return map;
}

function getText(block: Block, map: Map<string, Block>): string {
  if (!block.Relationships) return block.Text || '';
  const rel = block.Relationships.find(r => r.Type === 'CHILD');
  if (!rel?.Ids) return block.Text || '';
  return rel.Ids.map(id => map.get(id)?.Text || '').join(' ').trim();
}

export type TextractResult = {
  text: string;
  kv: Record<string, string>;
  tables: string[][][];
};

export async function runTextract(buffer: Buffer, filename: string): Promise<TextractResult> {
  const client = buildClient();
  let output: AnalyzeDocumentCommandOutput | undefined;

  if (buffer.byteLength <= FIVE_MB) {
    output = await client.send(new AnalyzeDocumentCommand({
      Document: { Bytes: buffer },
      FeatureTypes: ['FORMS', 'TABLES']
    }));
  } else {
    const bucket = process.env.AWS_TEXTRACT_S3_BUCKET;
    if (!bucket) throw new Error('File too large for Textract bytes and no S3 bucket configured');
    const s3 = buildS3();
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: filename, Body: buffer }));
    const start: StartDocumentAnalysisCommandOutput = await client.send(new StartDocumentAnalysisCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: filename } },
      FeatureTypes: ['FORMS', 'TABLES']
    }));
    const jobId = start.JobId;
    if (!jobId) throw new Error('Textract job missing id');
    let job;
    while (true) {
      await new Promise(r => setTimeout(r, 1000));
      job = await client.send(new GetDocumentAnalysisCommand({ JobId: jobId }));
      if (job.JobStatus === 'SUCCEEDED') { output = job; break; }
      if (job.JobStatus === 'FAILED' || job.JobStatus === 'PARTIAL_SUCCESS') throw new Error('Textract job failed');
    }
  }

  const blocks = output?.Blocks || [];
  const map = getBlockMap(blocks);

  const kv: Record<string, string> = {};
  for (const block of blocks) {
    if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')) {
      const key = getText(block, map);
      const valRel = block.Relationships?.find(r => r.Type === 'VALUE');
      const valId = valRel?.Ids?.[0];
      const val = valId ? getText(map.get(valId)!, map) : '';
      if (key) kv[key] = val;
    }
  }

  const text = blocks.filter(b => b.BlockType === 'LINE').map(b => b.Text || '').join('\n');

  const tables: string[][][] = [];
  for (const block of blocks) {
    if (block.BlockType === 'TABLE') {
      const rel = block.Relationships?.find(r => r.Type === 'CHILD');
      const cells: Block[] = [];
      if (rel?.Ids) {
        for (const id of rel.Ids) {
          const cell = map.get(id);
          if (cell?.BlockType === 'CELL') cells.push(cell);
        }
      }
      const grid: string[][] = [];
      for (const cell of cells) {
        const row = (cell.RowIndex || 1) - 1;
        const col = (cell.ColumnIndex || 1) - 1;
        grid[row] = grid[row] || [];
        grid[row][col] = getText(cell, map);
      }
      tables.push(grid);
    }
  }

  return { text, kv, tables };
}

