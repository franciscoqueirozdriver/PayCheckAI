import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

let doc: GoogleSpreadsheet;

async function getDoc(): Promise<GoogleSpreadsheet> {
    if (doc) return doc;

    // Valida a existência das variáveis de ambiente essenciais.
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
        throw new Error('Credenciais do Google Sheets não encontradas nas variáveis de ambiente. Verifique o arquivo .env.local.');
    }

    // Configura a autenticação JWT para a conta de serviço.
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      // A chave privada é lida do .env e as quebras de linha (\\n) são substituídas por \n.
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Instancia o documento da planilha usando o ID e a autenticação.
    const newDoc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
    await newDoc.loadInfo(); // Carrega as propriedades do documento e as informações das abas.
    doc = newDoc;
    return doc;
}


/**
 * Carrega o documento da Planilha Google e retorna uma aba (worksheet) específica pelo título.
 * @param sheetTitle O título da aba a ser carregada.
 * @returns O objeto da aba (worksheet).
 * @throws Lança um erro se a aba não for encontrada.
 */
async function getSheetByTitle(sheetTitle: string) {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
        throw new Error(`A aba com o título "${sheetTitle}" não foi encontrada.`);
    }
    return sheet;
}

/**
 * Obtém todas as linhas de uma aba específica.
 * @param sheetTitle O título da aba.
 * @returns Um array com as linhas da aba.
 */
export async function getRows(sheetTitle: string): Promise<GoogleSpreadsheetRow<any>[]> {
    const sheet = await getSheetByTitle(sheetTitle);
    return await sheet.getRows();
}

/**
 * Adiciona uma nova linha a uma aba específica.
 * A primeira linha da planilha deve conter os cabeçalhos (nomes das colunas).
 * @param sheetTitle O título da aba.
 * @param rowData Um objeto representando os dados da linha, onde as chaves correspondem aos cabeçalhos.
 * @returns A linha recém-adicionada.
 */
export async function addRow(sheetTitle: string, rowData: Record<string, string | number | boolean>): Promise<GoogleSpreadsheetRow<any>> {
    const sheet = await getSheetByTitle(sheetTitle);
    const newRow = await sheet.addRow(rowData);
    return newRow;
}
