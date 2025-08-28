# Documentação de Integração: Módulo PayCheckAI

Este documento descreve como configurar e executar o módulo PayCheckAI, que foi refatorado para ser integrado a um sistema Next.js existente.

## 1. Estrutura de Arquivos

A funcionalidade foi isolada nos seguintes diretórios para garantir o desacoplamento:

- **/app/paycheckai/**: Contém a rota principal da aplicação (`page.tsx`).
- **/app/api/paycheckai/**: Contém todas as rotas de API utilizadas pelo módulo.
- **/src/components/paycheckai/**: Contém todos os componentes React específicos do módulo.
- **/src/lib/paycheckai/**: Contém as funções de lógica de negócio, cálculos e utilitários.
- **/src/providers/paycheckai/**: Contém os "Adapters" que simulam a integração com providers de um sistema maior (Sessão, Permissões).
- **/src/types/paycheckai.ts**: Contém as definições de tipos TypeScript para o módulo.

## 2. Variáveis de Ambiente

O módulo depende de uma chave de API para consultar feriados. Adicione a seguinte variável ao seu arquivo `.env.local`:

```
# .env.example

# Token para a API de feriados da Invertexto (https://api.invertexto.com)
# O token abaixo é de exemplo e pode ser substituído.
INVERTEXTO_TOKEN="21402|JipPBIvm1zjnQHUesNshTHnz7UsZAXyA"

# Feature Flag (opcional) para controlar a visibilidade do módulo
NEXT_PUBLIC_FEATURE_PAYCHECKAI_ENABLED=true
```

## 3. Como Rodar Localmente

1.  **Instale as dependências:**
    ```bash
    npm install
    ```
2.  **Crie o arquivo de ambiente:**
    Copie o conteúdo do `.env.example` para um novo arquivo chamado `.env.local`.
    ```bash
    cp .env.example .env.local
    ```
3.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
4.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://localhost:3000/paycheckai`.

## 4. Controle de Acesso (Feature Flag)

O acesso à rota `/paycheckai` é controlado pelo `PaycheckAIGuard`. A lógica de permissão está no hook `usePaycheckAIPermissions` dentro de `src/providers/paycheckai/PermissionsAdapter.tsx`.

Atualmente, ele está configurado para verificar a variável de ambiente `NEXT_PUBLIC_FEATURE_PAYCHECKAI_ENABLED`. Se a variável for `true` (ou se não estiver definida, por segurança), o acesso é liberado. Para desativar o módulo, defina a variável como `false` em seu ambiente.

Em uma integração real, a função `temPermissao` dentro deste adapter deve ser modificada para usar o sistema de permissões real da aplicação principal.

## 5. Checklist de Verificação Pós-Merge

- [ ] Verificar se a rota `/paycheckai` está acessível.
- [ ] Confirmar que a tabela de pagamentos carrega os dados corretamente (bug de race condition corrigido).
- [ ] Testar se a mudança de mês no calendário filtra a tabela de pagamentos.
- [ ] Testar a seleção de Estado (UF) e Município e verificar se o cálculo de dias de descanso é atualizado.
- [ ] Validar a funcionalidade de adicionar, remover e editar um pagamento.
- [ ] Confirmar que as alíquotas globais (imposto/comissão) funcionam como esperado.
- [ ] Verificar se não houve regressão em outras partes do sistema (se aplicável).
- [ ] Confirmar que o build de produção (`npm run build`) é concluído sem erros.
