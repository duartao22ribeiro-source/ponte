# Equipa · quem mexe em quê

O projeto está dividido em 3 áreas: a hero e a base, as duas primeiras fases do percurso e as duas últimas. Cada pessoa trabalha nos seus ficheiros. Assim quase nunca há conflitos no Git.

| Pessoa | Área | Ecrãs |
|---|---|---|
| **1** · Duarte (`duartao22ribeiro-source`) | Hero e base | Entrar e criar conta, menu e topo da app, Início do participante, Perfil e RGPD, tema de vidro |
| **2** · Diogo (`diogopsilva1102-bit`) | Fases 1 e 2 · Preparar e Integrar | Ficha do destino, anfitrião, videochamada, embaixadores, agenda, guia local com mapa, diário, conversa · Anfitrião: gestão do território · Equipa: edições, territórios, anfitriões |
| **3** · Rodrigo (`rodrigopol27`) | Fases 3 e 4 · Mudar e Decidir | Plano de mudança, casas, apoios, visitas, decisão e testemunho · Anfitrião: painel e ficha do participante · Equipa: indicadores, testemunhos e relatório |

Os ecrãs do anfitrião e da equipa foram distribuídos pela fase a que dizem respeito. O plano de mudança, por exemplo, também é editado pelo anfitrião, por isso fica com a Pessoa 3.

## Ficheiros de cada pessoa

### Pessoa 1 · Hero e base
- `public/js/hero/entrada.js` · hero, paisagem, entrar e criar conta
- `public/css/hero.css`
- `public/js/participante/inicio.js` · Início do participante
- `public/js/nucleo/perfil.js` · Perfil, exportar e apagar dados
- `lib/rotas/conta.js` · login, registo, conta, RGPD, visão geral
- Os ficheiros partilhados (ver abaixo), que revê quando outra pessoa mexe neles

### Pessoa 2 · Fases 1 e 2 (Preparar e Integrar)
- `public/js/fases/1-preparar.js` · ficha do destino, anfitrião, videochamada, embaixadores
- `public/js/fases/2-integrar.js` · agenda, guia, diário
- `public/js/fases/2-conversa.js` · conversa
- `public/css/fases/1-preparar.css` · `public/css/fases/2-integrar.css`
- `public/js/anfitriao/territorio.js` · conteúdos do território
- `public/js/equipa/gestao.js` · edições, territórios, anfitriões
- `lib/rotas/preparar.js` · `lib/rotas/integrar.js` · `lib/rotas/territorio.js` · `lib/rotas/equipa-gestao.js`

### Pessoa 3 · Fases 3 e 4 (Mudar e Decidir)
- `public/js/fases/3-mudar.js` · plano, casas, apoios, visitas
- `public/js/fases/4-decidir.js` · decisão e testemunho
- `public/css/fases/3-mudar.css` · `public/css/fases/4-decidir.css`
- `public/js/anfitriao/painel.js` · `public/css/anfitriao.css`
- `public/js/equipa/indicadores.js` · `public/css/equipa.css`
- `lib/rotas/mudar.js` · `lib/rotas/decidir.js` · `lib/rotas/anfitriao.js` · `lib/rotas/equipa-indicadores.js`

## Ficheiros partilhados (avisa o grupo antes de mexer)

São usados por todos, e uma alteração aqui pode estragar o trabalho dos outros. A Pessoa 1 revê estas alterações.

| Ficheiro | Para quê |
|---|---|
| `public/js/nucleo/estado.js` | Utilitários, constantes (fases, estados) e ícones |
| `public/js/nucleo/ui.js` | Componentes: `api()`, `openForm()`, `openModal()`, `toast()`, separadores |
| `public/js/nucleo/router.js` | Estrutura da app e navegação |
| `public/js/main.js` | Menu de cada perfil (`NAV`) e arranque |
| `public/css/base.css` | Cores da marca, cartões, botões, formulários e tema de vidro |
| `public/index.html` | Lista de CSS e JS carregados |
| `lib/nucleo.js` | Base de dados, sessão, permissões e cálculos partilhados |
| `lib/db.js` | Esquema SQLite e dados de demonstração |

Antes de criar algo novo num ficheiro teu, vê se já existe em `ui.js` ou `estado.js` (um formulário em modal, um aviso, uma etiqueta de estado). Se precisares de um componente que sirva a mais áreas, pede-o à Pessoa 1 em vez de o copiar.

## Como trabalhar no Git

1. Começa sempre pela versão mais recente:
   ```bash
   git switch main && git pull
   ```
2. Cria um ramo com o teu número e o tema:
   ```bash
   git switch -c p2/agenda-filtros
   ```
3. Faz commits pequenos, só com os teus ficheiros, e envia:
   ```bash
   git push -u origin p2/agenda-filtros
   ```
4. Abre um Pull Request para `main`. Se tocaste num ficheiro partilhado, pede revisão à Pessoa 1.
5. Depois de juntar, apaga o ramo e volta ao passo 1.

Nunca faças `git push --force` no `main`.

## Como acrescentar coisas

- **Um ecrã novo:** escreve a função no teu ficheiro (por exemplo `async function pAgendaMes(main) { … }`). Depois pede à Pessoa 1 que acrescente a linha no `NAV` de `public/js/main.js`.
- **Um ficheiro JS novo:** acrescenta-o a `public/index.html`, antes de `main.js`, que tem de ser sempre o último.
- **Um ficheiro de rotas novo:** cria-o em `lib/rotas/` e acrescenta `require('./rotas/<nome>')` em `lib/ponte.js`.
- **Uma rota nova da API:** usa `route('GET', '/api/...', ({ user, params, body, query }) => …)` no teu ficheiro em `lib/rotas/`. Verifica sempre as permissões, com `requireRole` e `assertParticipantAccess`.
- **Uma tabela ou coluna nova:** altera `lib/db.js`, avisa o grupo e corre `npm run reset`.

## Regras de estilo

- Português de Portugal, a tratar o utilizador por "tu".
- Usa as variáveis de cor de `base.css` (`--dark`, `--accent`, `--brand`, …) em vez de cores soltas.
- Títulos em Lexend Exa e texto em Lexend. Cantos arredondados, poucos ícones e nenhum emoji.
- Os dados de demonstração são todos fictícios.
- Antes de abrir o PR, experimenta a tua área no telemóvel (390 px de largura) e no computador.
