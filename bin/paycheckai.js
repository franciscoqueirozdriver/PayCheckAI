#!/usr/bin/env node
require('ts-node/register');
const fs = require('fs');

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  const path = '/tmp/gcv.json';
  fs.writeFileSync(path, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, 'utf8');
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path;
}
const { importHolerites } = require('../lib/importHolerites');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

yargs(hideBin(process.argv))
  .command('import-holerites', 'Importa holerites para o Google Sheets', (y)=>
    y.option('path', { type: 'string', demandOption: true })
     .option('user_email', { type: 'string' })
     .option('data_pagamento', { type: 'string' })
     .option('ocr', { type: 'string', default: 'tesseract' })
     .option('dedupe', { type: 'string', default: 'update' })
     .option('dry-run', { type: 'boolean', default: false })
  , async (args)=> {
    const res = await importHolerites({
      files: args.path,
      userEmail: args.user_email,
      dataPagamentoDefault: args.data_pagamento,
      ocrEngine: args.ocr,
      dedupeMode: args.dedupe,
      dryRun: args['dry-run']
    });
    console.log(res);
  })
  .demandCommand(1)
  .help()
  .argv;
