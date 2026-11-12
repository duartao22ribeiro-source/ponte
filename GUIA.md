# Guia · do zero ao site online

Passo a passo para pôr a Ponte no GitHub e na Vercel e trabalhar a 3. Não precisas de experiência com Git.

- **Parte 1:** quem cria o projeto (faz-se uma vez).
- **Parte 2:** os outros 2 colegas (cada um faz uma vez).
- **Parte 3:** o dia a dia de todos.

Quem mexe em quê está em [EQUIPA.md](EQUIPA.md).

---

## Parte 1 · Quem cria o projeto

### 1. Criar as contas
- As 3 pessoas criam conta em **github.com/signup** e partilham entre si o **nome de utilizador**. É o nome que aparece em `github.com/<nome>`, não o e-mail.
- Quem cria o projeto entra também em **vercel.com/signup**, com o botão **Continue with GitHub**.

### 2. Instalar a ferramenta do GitHub
No Terminal:
```bash
brew install gh
gh auth login
```
Responde assim às perguntas:
1. `GitHub.com`
2. `HTTPS`
3. `Yes`, para autenticar o Git com as credenciais do GitHub
4. `Login with a web browser`

Copia o código de 8 letras que aparece, carrega Enter, cola-o no browser e autoriza. A partir daqui o Git já não pede palavra-passe.

### 3. Pôr o teu nome nos commits
```bash
git config --global user.name "O teu nome"
git config --global user.email "o-email-da-tua-conta-github"
cd ~/ponte
git commit --amend --reset-author --no-edit
```
A última linha muda o autor do commit que já existe para o teu nome.

### 4. Criar o repositório e enviar o código
```bash
cd ~/ponte
gh repo create ponte --private --source . --push
```
Este comando cria o repositório no GitHub, liga-o à pasta e envia tudo. O código fica em `github.com/<o-teu-nome>/ponte`.

> **Sem a ferramenta `gh`:** cria o repositório em **github.com/new** (nome `ponte`, Private, sem README) e corre `git remote add origin https://github.com/<o-teu-nome>/ponte.git` e depois `git push -u origin main`.

### 5. Convidar os colegas
```bash
gh api -X PUT repos/<o-teu-nome>/ponte/collaborators/<nome-do-colega> -f permission=push
```
Repete para o segundo colega. Também se faz no site, em **Settings → Collaborators → Add people**. Cada colega recebe um e-mail e tem de **aceitar o convite**.

### 6. Ligar os responsáveis por área (CODEOWNERS)
Abre `.github/CODEOWNERS` e faz duas coisas:
- Troca `NOME-PESSOA-1`, `NOME-PESSOA-2` e `NOME-PESSOA-3` pelos nomes de utilizador, com `@` antes (por exemplo `@maria-silva`).
- Tira o `#` do início das linhas com nomes.

Depois envia a alteração:
```bash
git add .github/CODEOWNERS
git commit -m "Responsáveis por área"
git push
```
A partir daqui, cada Pull Request pede revisão automaticamente ao dono da área.

### 7. Proteger o `main` (recomendado)
No site, entra em **Settings → Branches → Add branch ruleset**:
- **Target:** `main`
- Ativa **Require a pull request before merging**, com 1 aprovação
- Ativa **Block force pushes**

Assim ninguém envia diretamente para o `main` por engano.

> Nos repositórios **privados**, o plano gratuito do GitHub não aplica estas regras. Há duas saídas: tornar o repositório público (Settings → General → Change visibility) ou combinar a regra entre vocês.

### 8. Pôr o site online na Vercel
1. Entra em **vercel.com/new** e escolhe o repositório `ponte` → **Import**.
2. Em **Framework Preset**, deixa **Other**. Não mexas em mais nada, porque o `vercel.json` já trata do resto.
3. Carrega em **Deploy**. Ao fim de 1 minuto tens o endereço (`ponte-xxxx.vercel.app`).

A partir daqui a Vercel atualiza tudo sozinha:
- **Cada envio para o `main`** atualiza o site.
- **Cada Pull Request** ganha um endereço de pré-visualização próprio, para verem as alterações antes de as juntar.

> Na Vercel os dados de demonstração voltam ao início sempre que o servidor reinicia. Serve para mostrar, não para guardar dados reais.

---

## Parte 2 · Os outros 2 colegas

### 1. Instalar o que é preciso
1. **Homebrew** (Mac): copia o comando que está em **brew.sh** para o Terminal.
2. Depois:
   ```bash
   brew install node git gh
   gh auth login        # mesmas respostas da Parte 1, passo 2
   git config --global user.name "O teu nome"
   git config --global user.email "o-email-da-tua-conta-github"
   ```
3. Aceita o convite do GitHub, que chega por e-mail ou aparece em github.com/notifications.

No Windows, instala **Node.js LTS** (nodejs.org), **Git** (git-scm.com) e **GitHub CLI** (cli.github.com). Depois usa o Git Bash para os mesmos comandos.

### 2. Descarregar o projeto e pô-lo a correr
```bash
cd ~
gh repo clone duartao22ribeiro-source/ponte
cd ponte
npm start
```
Abre **http://localhost:8095**. A palavra-passe de todas as contas de demonstração é `ponte2026`.

Para parar o servidor, carrega em `Ctrl + C` no Terminal. Para voltar aos dados de demonstração iniciais, corre `npm run reset`.

### 3. Abrir no editor
Recomendamos o **VS Code**. Faz File → Open Folder → `ponte`. O painel **Source Control** (ícone de ramos à esquerda) mostra o que alteraste e permite fazer commits sem o Terminal.

---

## Parte 3 · O dia a dia (todos)

### Começar uma tarefa
```bash
git switch main
git pull                          # traz o trabalho dos outros
git switch -c p2/filtros-agenda   # p1, p2 ou p3 + o tema
```

### Ir guardando
```bash
git add public/js/fases/2-integrar.js public/css/fases/2-integrar.css
git commit -m "Agenda: filtro por fim de semana"
```
Faz commits pequenos, com mensagens que digam o que mudou. Usa `git add` só com os teus ficheiros. Evita `git add .` se mexeste em ficheiros de outros por engano.

### Enviar e pedir revisão
```bash
git push -u origin p2/filtros-agenda
gh pr create --fill
```
O segundo comando cria o Pull Request, que também se pode abrir no site. Preenche a lista de verificação do modelo e espera pela aprovação. A Vercel comenta no PR com o endereço de pré-visualização.

### Juntar e recomeçar
Depois de aprovado, carrega em **Merge pull request** no site e corre:
```bash
git switch main
git pull
git branch -d p2/filtros-agenda
```

### Quando o teu ramo ficou para trás
Se o `main` mudou enquanto trabalhavas:
```bash
git switch main && git pull
git switch p2/filtros-agenda
git merge main
```

### Se aparecer um conflito
O Git marca o ficheiro com blocos `<<<<<<<`, `=======` e `>>>>>>>`. Abre o ficheiro no VS Code, escolhe **Accept Current**, **Accept Incoming** ou **Accept Both**, guarda e corre:
```bash
git add <ficheiro>
git commit
```
Com a divisão por áreas isto deve ser raro. Se acontecer num ficheiro partilhado, fala com a Pessoa 1.

---

## Problemas comuns

| Problema | Solução |
|---|---|
| `Permission denied` ou `403` ao fazer push | Aceitaste o convite? Corre `gh auth login` outra vez. |
| `rejected … fetch first` | Alguém enviou antes de ti. Faz `git pull` e depois `git push`. |
| `port 8095 already in use` | Já tens o servidor aberto noutro Terminal. Fecha-o com `Ctrl + C`, ou corre `PORT=8096 npm start`. |
| O site não muda depois de alterar CSS ou JS | Recarrega sem cache: `Cmd + Shift + R`. |
| `node:sqlite` não encontrado | O Node é antigo. Corre `brew upgrade node` (é preciso o 22.13 ou mais recente). |
| Os dados ficaram estranhos depois de testes | `npm run reset` |
| A Vercel mostra `FUNCTION_INVOCATION_FAILED` | Abre `<site>/api/me` para ver o erro e confirma que o deploy é do `main` mais recente. |
