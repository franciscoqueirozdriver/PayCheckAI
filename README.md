# PayCheckAI - Cálculo de DSR

Aplicação Next.js para calcular o DSR (Descanso Semanal Remunerado) sobre comissões, com base em dias úteis, domingos e feriados.

## Funcionalidades

- Cálculo de DSR com base em dias úteis (considerando sábados ou não) e dias de descanso (domingos + feriados).
- Agregação de feriados de fontes nacionais (BrasilAPI), estaduais (Nager.Date) e municipais (base local).
- Interface para gestão de pagamentos com aplicação de alíquotas globais de imposto e comissão.
- Persistência das configurações e lançamentos no `localStorage`.

## Configuração de Feriados Municipais

É possível adicionar feriados municipais customizados editando o arquivo `lib/municipal.json`.

**Estrutura:**

O arquivo é um JSON onde a chave principal é o **ano** e, dentro de cada ano, a chave é o **código IBGE** do município.

```json
{
  "instructions": "Adicione feriados aqui, organizados por ano e código IBGE.",
  "2025": {
    "3106200": [
      { "date": "2025-08-15", "name": "Assunção de Nossa Senhora" }
    ]
  }
}
```

- **Ano (ex: "2025")**: Agrupa os feriados por ano.
- **Código IBGE (ex: "3106200")**: Identifica o município.
- **Lista de feriados**: Cada objeto deve conter `date` (formato `YYYY-MM-DD`) e `name`.

## Endpoints da API

A aplicação expõe os seguintes endpoints:

### 1. Agregador de Feriados

Retorna uma lista consolidada de feriados.

- **URL**: `/api/feriados`
- **Método**: `GET`
- **Parâmetros**:
  - `year` (obrigatório): Ano no formato YYYY.
  - `uf` (opcional): Sigla do estado (ex: `SP`).
  - `ibge` (opcional): Código IBGE do município.
  - `includeMunicipal` (opcional): `1` para incluir feriados municipais.
- **Exemplo de chamada**:
  ```
  /api/feriados?year=2025&uf=MG&ibge=3106200&includeMunicipal=1
  ```

### 2. Calculadora de Calendário DSR

Calcula os dias úteis e de descanso para um determinado mês.

- **URL**: `/api/dsr/calendario`
- **Método**: `GET`
- **Parâmetros**:
  - `year`, `month` (obrigatórios).
  - `uf`, `ibge` (opcionais).
  - `includeSaturday`: `1` para contar sábados como dia útil.
  - `considerarFeriados`: `1` para usar a API de feriados no cálculo.
- **Exemplo de chamada**:
  ```
  /api/dsr/calendario?year=2025&month=8&uf=MG&ibge=3106200&includeSaturday=0&considerarFeriados=1
  ```

## Extração de dados de holerite

O utilitário `extractor/extract.js` processa um holerite em PDF e devolve um JSON
com os principais totais e itens encontrados.

### Dependências

```bash
npm install pdf-parse diacritics tesseract.js # tesseract.js é opcional
```

Para o fallback de OCR é necessário ter o
[`poppler-utils`](https://poppler.freedesktop.org/) instalado para fornecer o
comando `pdftoppm`.

### Uso

```bash
node extractor/extract.js caminho/para/holerite.pdf
```

O script remove trechos duplicados do PDF e recorre a OCR quando não há texto
embutido.

## Checklist de Deploy (Anti-404 Vercel)

Para garantir que a aplicação funcione corretamente na Vercel e evitar erros 404:

- **Root Directory**: Nas configurações do projeto na Vercel, defina como **“/” (raiz do repositório)** ou deixe em branco.
- **Framework Preset**: `Next.js`.
- **Build Command**: `next build`.
- **Output Directory**: Padrão do Next.js (não sobrescrever).
- **Validação Pós-Deploy**:
  - `GET /` deve retornar **200 OK**.
  - `GET /favicon.ico` deve retornar **200 OK** (e ser um arquivo de imagem binário).
  - O painel "Network" do navegador não deve mostrar erros 404 para nenhum recurso (CSS, JS, Imagens, etc.).
