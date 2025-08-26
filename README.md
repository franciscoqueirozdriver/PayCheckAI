# PayCheckAI - Cálculo de DSR

Aplicação Next.js para calcular o DSR sobre comissões.

## Checklist de validação

- [ ] Abrir `/` → 200 OK
- [ ] Acessar `/favicon.ico` → 200 OK
- [ ] Sem 404 no Network para CSS/JS/IMG/ico após o carregamento inicial

## Anti-404 (Vercel)
- Root Directory = “/” (raiz do repositório).
- Framework Preset = Next.js.
- Build Command = `next build`.
- Output: padrão do Next (não usar `next export`).
- Após deploy:
  - GET `/` → 200 OK
  - GET `/favicon.ico` → 200 OK
  - Aba Network sem 404 de CSS/JS/IMG/ICO.
- Se local `npm run build && npm run start` abre `http://localhost:3000/`, mas no Vercel dá 404, ajuste **Root Directory**.
