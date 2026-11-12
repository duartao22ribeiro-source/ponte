# ponte

_Descreve aqui o objetivo do projeto em 2–3 frases._

**Stack:** Node.js (npm)

## Estrutura

```
.github/
  CODEOWNERS
  pull_request_template.md
api/
  index.js
lib/
  db.js
  nucleo.js
  ponte.js
  rotas/
public/
  css/
  icons/
  img/
  index.html
  js/
  manifest.webmanifest
  sw.js
.editorconfig
.gitattributes
.gitignore
.vercelignore
EQUIPA.md
GUIA.md
package.json
README.md
vercel.json
```

## Comandos

- Instalar dependências: `npm install`
- Correr em desenvolvimento: `npm run dev`
- Build: `npm run build`

## Convenções de código

- JavaScript moderno (ES modules, `const`/`let`).
- Componentes e ficheiros com nomes descritivos; um componente por ficheiro.
- Segue o estilo que já existe no ficheiro que estás a editar.
- Funções pequenas e com nomes claros; comenta o *porquê*, não o *quê*.
- Não adiciones dependências novas sem falar com a equipa.
- Nunca escrevas segredos (tokens, passwords) no código — usa variáveis de ambiente (`.env`, que não vai para o git).

## Regras da equipa (obrigatórias)

1. **Trabalha sempre numa branch própria**: `<o-teu-login>/<tarefa>` (ex.: `duarte/login-github`).
2. **Nunca faças push direto para `main`** — a `main` está protegida e só recebe código por Pull Request.
3. **Commits pequenos, com mensagens claras** no imperativo: `Adicionar validação do formulário de login`.
4. Quando terminares, **abre um PR para `main`** com o que mudou e como testar. Escreve `closes #<issue>` se fechar uma issue.
5. Antes de abrir o PR: `git fetch origin && git rebase origin/main` e confirma que o projeto compila.
6. Se fores mexer em ficheiros que outra pessoa está a editar (a app avisa), combina primeiro no chat.

## Para o Claude

- Antes de alterar código, lê os ficheiros relevantes e explica o plano em poucas linhas.
- Confirma em que branch estás (`git branch --show-current`); se estiveres na `main`, cria uma branch nova antes de mexer.
- Faz commits pequenos à medida que avanças; não juntes alterações não relacionadas.
- Nunca faças `git push --force` nem push para a `main`.
- Se o servidor MCP "sintonia" estiver ligado, usa-o para ver as tarefas atribuídas, marcar a tarefa como "em curso"/"feito" e publicar o estado (ex.: "A editar auth.ts com o Claude").
