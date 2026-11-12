# Ponte · Rural Move

<img src="public/icons/ponte-logo.svg" alt="Ponte · by Rural Move" width="320">

PWA mobile-first do serviço **Ponte para a Fixação**. Liga o participante, o anfitrião local e a equipa da Rural Move, desde a semana antes da estadia até à decisão de ficar.

**Primeira vez?** Segue o [GUIA.md](GUIA.md): GitHub, Vercel e trabalho em equipa, passo a passo.

## Arrancar

```bash
npm start            # http://localhost:8095
npm run reset        # apaga a base de dados e volta aos dados de demonstração
```

Não tem dependências: usa Node 22.13+ (SQLite embutido em `node:sqlite`). A base de dados fica em `ponte.db` e é criada com dados de demonstração no primeiro arranque.

## Contas de demonstração (palavra-passe `ponte2026`)

| Conta | Papel |
|---|---|
| marta@exemplo.pt | Participante · Preparar |
| rui@exemplo.pt | Participante · Integrar |
| sofia@exemplo.pt | Participante · Mudar (com alerta de +14 dias sem contacto) |
| tiago@exemplo.pt | Participante · Decidir (mudou-se, testemunho pendente) |
| anfitria@ruralmove.demo | Anfitriã de Miranda do Douro |
| equipa@ruralmove.demo | Equipa Rural Move |

Todos os nomes, contactos e apoios municipais são fictícios.

## Estrutura

O código está dividido por áreas para 3 pessoas trabalharem em paralelo. Vê **[EQUIPA.md](EQUIPA.md)** para saber quem mexe em quê e como usar o Git.

```
lib/
  ponte.js            servidor HTTP (ficheiros estáticos + encaminhamento da API)
  nucleo.js           base de dados, sessão, permissões, cálculos partilhados
  db.js               esquema SQLite e dados de demonstração
  rotas/              uma rota por área: conta, preparar, integrar, mudar, decidir,
                      anfitriao, territorio, equipa-gestao, equipa-indicadores
api/index.js          entrada na Vercel
public/
  index.html          carrega os CSS e JS por ordem
  css/                base.css, hero.css, fases/1-preparar.css … 4-decidir.css, anfitriao.css, equipa.css
  js/
    nucleo/           estado, componentes (ui), navegação (router), perfil
    hero/entrada.js   hero, entrar e criar conta
    participante/     início do participante
    fases/            1-preparar, 2-integrar, 2-conversa, 3-mudar, 4-decidir
    anfitriao/        painel, território
    equipa/           gestão, indicadores
    main.js           menu de cada perfil e arranque (sempre o último)
  sw.js, manifest.webmanifest, icons/
```

Não há passo de build: os ficheiros são servidos tal como estão. Os scripts partilham o mesmo âmbito global, por isso uma função de `nucleo/ui.js` pode ser usada diretamente em `fases/3-mudar.js`.

## Permissões

- **Participante**: só os seus dados e os conteúdos do território da sua edição.
- **Anfitrião**: só participantes inscritos em edições do seu território; gere guia, agenda, casas, apoios e ficha do destino desse território.
- **Equipa**: tudo, mais territórios, edições, contas de anfitriões, testemunhos, indicadores e relatório.

## RGPD

Consentimento obrigatório no registo (com data guardada), agregado familiar opcional, exportação dos dados em JSON e apagamento da conta (em cascata) a partir do perfil.

## Para produção

- Servir com HTTPS (a PWA e o cookie de sessão precisam). Na Vercel o cookie já leva `Secure`.
- Na Vercel a base de dados fica em `/tmp` e volta aos dados de demonstração quando a função reinicia. Para dados reais é preciso uma base de dados externa.
- Envio de e-mails (recuperar palavra-passe, avisos ao anfitrião) ainda não está implementado.
- O relatório PDF usa a impressão do browser ("Guardar como PDF").
