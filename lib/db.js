// Base de dados SQLite (node:sqlite, sem dependências externas) + dados de demonstração.
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');

// Na Vercel só /tmp aceita escrita (e é apagado quando a função adormece).
const DB_FILE = process.env.PONTE_DB || (process.env.VERCEL ? '/tmp/ponte.db' : path.join(__dirname, '..', 'ponte.db'));

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS territories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  region TEXT,
  description TEXT,
  lat REAL, lng REAL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('participante','anfitriao','admin')),
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  bio TEXT,
  city TEXT,
  territory_id INTEGER REFERENCES territories(id) ON DELETE SET NULL,
  work_situation TEXT,
  remote_days INTEGER,
  household TEXT,
  move_interest INTEGER,
  consent_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS editions (
  id INTEGER PRIMARY KEY,
  territory_id INTEGER NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  slots INTEGER NOT NULL DEFAULT 8,
  host_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cost REAL
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL DEFAULT 'preparar' CHECK (phase IN ('preparar','integrar','mudar','decidir')),
  arrival TEXT,
  departure TEXT,
  interest_end INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS destination_sheets (
  territory_id INTEGER PRIMARY KEY REFERENCES territories(id) ON DELETE CASCADE,
  accommodation TEXT,
  meals TEXT,
  workspace TEXT,
  internet_mbps INTEGER,
  internet_upload_mbps INTEGER,
  internet_tested_at TEXT,
  quiet_space INTEGER NOT NULL DEFAULT 0,
  quiet_space_notes TEXT,
  included TEXT,
  not_included TEXT
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  territory_id INTEGER NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  spots INTEGER
);

CREATE TABLE IF NOT EXISTS activity_signups (
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS guide_items (
  id INTEGER PRIMARY KEY,
  territory_id INTEGER NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  lat REAL, lng REAL
);

CREATE TABLE IF NOT EXISTS move_plans (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES move_plans(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('casa','apoios','escola','emprego')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'por_fazer' CHECK (status IN ('por_fazer','em_curso','feito')),
  due_date TEXT,
  notes TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS houses (
  id INTEGER PRIMARY KEY,
  territory_id INTEGER NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('arrendamento','compra')),
  price REAL,
  location TEXT,
  bedrooms INTEGER,
  description TEXT,
  photo TEXT,
  contact TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS municipal_supports (
  id INTEGER PRIMARY KEY,
  territory_id INTEGER NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS contact_logs (
  id INTEGER PRIMARY KEY,
  host_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  participant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  summary TEXT
);

CREATE TABLE IF NOT EXISTS host_notes (
  participant_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  host_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT,
  territory_id INTEGER REFERENCES territories(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
  available_for_chat INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ambassador_requests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  testimonial_id INTEGER NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pedido' CHECK (status IN ('pedido','marcado','concluido')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('mudei','visitas','embaixador')),
  ambassador INTEGER NOT NULL DEFAULT 0,
  moved_at TEXT,
  locality TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('gostei','preocupa')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  nights INTEGER,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pedida' CHECK (status IN ('pedida','confirmada','realizada','cancelada'))
);

CREATE TABLE IF NOT EXISTS welcome_calls (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  datetime TEXT NOT NULL,
  note TEXT,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'pedida' CHECK (status IN ('pedida','confirmada','realizada','cancelada'))
);
`;

function open() {
  const db = new DatabaseSync(DB_FILE);
  db.exec(SCHEMA);
  const count = db.prepare('SELECT COUNT(*) n FROM users').get().n;
  if (count === 0) seed(db);
  return db;
}

// ---------- Dados de demonstração (todos fictícios) ----------
function isoDay(offsetDays) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function isoDateTime(offsetDays, hhmm = '10:00') {
  return `${isoDay(offsetDays)}T${hhmm}`;
}
// Próximo sábado/domingo a partir de hoje (+ semanas)
function weekend(weeks, sunday = false) {
  const d = new Date();
  const toSat = (6 - d.getDay() + 7) % 7 || 7;
  return isoDay(toSat + weeks * 7 + (sunday ? 1 : 0));
}

function seed(db) {
  const pw = hashPassword('ponte2026');
  const run = (sql, ...p) => db.prepare(sql).run(...p);
  db.exec('BEGIN');
  try {
    const terr = run(
      `INSERT INTO territories (name, municipality, region, description, lat, lng) VALUES (?,?,?,?,?,?)`,
      'Planalto Mirandês', 'Miranda do Douro', 'Trás-os-Montes',
      'Território-piloto da Ponte para a Fixação. Aldeias do planalto junto às arribas do Douro internacional, com língua própria (o mirandês), forte vida associativa e casas para recuperar.',
      41.4956, -6.2741
    ).lastInsertRowid;

    run(`INSERT INTO users (email,password_hash,role,name,phone,bio,city,consent_at) VALUES (?,?,?,?,?,?,?,datetime('now'))`,
      'equipa@ruralmove.demo', pw, 'admin', 'Joana Vidal', '210 000 000', 'Coordenação das Rural Experiences.', 'Lisboa');

    const host = run(
      `INSERT INTO users (email,password_hash,role,name,phone,bio,city,territory_id,consent_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))`,
      'anfitria@ruralmove.demo', pw, 'anfitriao', 'Leonor Ferreira', '930 000 101',
      'Nasci em Sendim, vivi 12 anos no Porto e voltei em 2019 com a minha família. Trabalho na associação cultural da aldeia e conheço quase toda a gente do planalto. Vou ajudar-te a perceber se esta vida é para ti, sem pressas.',
      'Sendim, Miranda do Douro', terr
    ).lastInsertRowid;

    const ed = run(
      `INSERT INTO editions (territory_id,name,start_date,end_date,slots,host_id,cost) VALUES (?,?,?,?,?,?,?)`,
      terr, 'Planalto Mirandês · Edição piloto', isoDay(-200), isoDay(30), 8, host, 9600
    ).lastInsertRowid;

    // Ficha do destino
    run(`INSERT INTO destination_sheets VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      terr,
      'Quarto individual com casa de banho privada na Casa da Eira, uma casa de xisto recuperada em Sendim, partilhada com mais 3 participantes. Cozinha e sala comuns, lavandaria.',
      'Pequeno-almoço todos os dias. Jantar comunitário à quinta-feira e almoço de domingo com a comunidade. As restantes refeições são livres (cozinha equipada disponível).',
      'Espaço de cowork na antiga escola primária, a 3 minutos a pé, aberto das 8h às 20h, com secretárias, ecrãs externos e café.',
      210, 45, isoDay(-12), 1,
      'Duas salas fechadas para chamadas, reservadas por ordem de chegada.',
      'Alojamento\nPequeno-almoço diário\nJantar comunitário semanal\nCowork com internet por fibra\nAcompanhamento do anfitrião (antes, durante e 6 meses depois)\nAtividades com a comunidade',
      'Viagem até Miranda do Douro\nRefeições livres\nAtividades com custo próprio (indicado em cada uma)\nCarro (há boleias organizadas pelo anfitrião)'
    );

    // Atividades (sobretudo ao fim de semana)
    const acts = [
      ['Caminhada nas arribas do Douro', 'Percurso de 8 km com um guia local até ao miradouro de São João das Arribas. Ritmo tranquilo.', weekend(0), '09:30', 'Largo da Igreja, Sendim', 12],
      ['Almoço de domingo na Associação', 'Almoço com as famílias da aldeia. Posta mirandesa e conversa à mesa. Contribuição: 8 €.', weekend(0, true), '13:00', 'Associação Cultural de Sendim', 20],
      ['Oficina de pauliteiros', 'Os pauliteiros de Miranda mostram a dança tradicional e convidam-te a experimentar.', weekend(1), '16:00', 'Centro Cultural', 15],
      ['Conversa: viver e trabalhar no planalto', 'Três pessoas que se mudaram para o concelho contam como foi. Aberto à população.', isoDay(4), '18:30', 'Cowork da antiga escola', 30],
      ['Feira dos produtores', 'Mercado mensal de produtos locais. Boa ocasião para conhecer quem produz o que comes.', weekend(2), '10:00', 'Praça D. João III, Miranda do Douro', null],
    ];
    const actIds = acts.map(a => run(`INSERT INTO activities (territory_id,title,description,date,time,location,spots) VALUES (?,?,?,?,?,?,?)`, terr, ...a).lastInsertRowid);

    // Guia local
    const guide = [
      ['negocios', 'Mercearia da Ti Lurdes', 'Mercearia com pão diário, fruta da região e encomendas por telefone.', 'Lurdes', '273 000 201', 'Rua Central, Sendim', 41.3906, -6.4252],
      ['negocios', 'Café Planalto', 'Café com esplanada e bom Wi-Fi. Ponto de encontro ao fim da tarde.', 'Sr. Armando', '273 000 202', 'Largo da Igreja, Sendim', 41.3912, -6.4241],
      ['negocios', 'Cooperativa Agrícola Mirandesa', 'Produtos locais: carne mirandesa, mel, azeite.', null, '273 000 203', 'Miranda do Douro', 41.4952, -6.2720],
      ['saude', 'Extensão de Saúde de Sendim', 'Consultas de medicina geral às terças e quintas. Enfermagem diária.', null, '273 000 301', 'Rua do Centro de Saúde, Sendim', 41.3898, -6.4260],
      ['saude', 'Centro de Saúde de Miranda do Douro', 'Atendimento complementar todos os dias até às 20h.', null, '273 000 302', 'Miranda do Douro', 41.4970, -6.2765],
      ['saude', 'Farmácia de Sendim', 'Aberta de segunda a sábado.', null, '273 000 303', 'Rua Central, Sendim', 41.3909, -6.4248],
      ['escolas', 'Jardim de Infância de Sendim', 'Pré-escolar dos 3 aos 5 anos, com transporte assegurado pela câmara.', 'Educadora Paula', '273 000 401', 'Sendim', 41.3915, -6.4270],
      ['escolas', 'Agrupamento de Escolas de Miranda do Douro', 'Do 1.º ciclo ao secundário. Transporte escolar gratuito a partir das aldeias.', 'Secretaria', '273 000 402', 'Miranda do Douro', 41.4940, -6.2790],
      ['transportes', 'Autocarro Sendim – Miranda', 'Ligações diárias às 7h40, 13h15 e 18h00 (dias úteis).', null, null, 'Paragem do Largo, Sendim', 41.3910, -6.4245],
      ['transportes', 'Expresso Miranda – Porto/Lisboa', 'Ligação diária de autocarro ao Porto (cerca de 4h) e a Lisboa.', null, null, 'Terminal de Miranda do Douro', 41.4960, -6.2730],
      ['transportes', 'Táxi do Sr. Fernando', 'Serviço por marcação, também para Bragança.', 'Fernando', '930 000 501', 'Sendim', null, null],
      ['contactos', 'Junta de Freguesia de Sendim', 'Atendimento às segundas, quartas e sextas de manhã.', 'Presidente da Junta', '273 000 601', 'Sendim', 41.3903, -6.4256],
      ['contactos', 'Gabinete de Apoio ao Investidor e Novos Residentes', 'Na câmara municipal. Informa sobre apoios à fixação e habitação.', 'Dra. Carla', '273 000 602', 'Câmara Municipal de Miranda do Douro', 41.4955, -6.2744],
    ];
    guide.forEach(g => run(`INSERT INTO guide_items (territory_id,category,name,description,contact_person,phone,address,lat,lng) VALUES (?,?,?,?,?,?,?,?,?)`, terr, ...g));

    // Casas
    const houses = [
      ['Casa de pedra com quintal', 'arrendamento', 380, 'Sendim', 2, 'Casa de dois pisos recuperada há 5 anos, com lareira, quintal de 80 m² e fibra ótica na rua.', 'Leonor Ferreira (anfitriã) · 930 000 101', 'pedra'],
      ['T3 no centro de Miranda', 'arrendamento', 450, 'Miranda do Douro', 3, 'Apartamento no centro histórico, a 5 minutos da escola. Disponível a partir do próximo mês.', 'Imobiliária Planalto · 273 000 701', 'centro'],
      ['Casa para recuperar com terreno', 'compra', 42000, 'Palaçoulo', 3, 'Casa tradicional para recuperar com 1 200 m² de terreno. Pode candidatar-se ao apoio municipal à reabilitação.', 'Proprietário (via anfitriã) · 930 000 101', 'ruina'],
      ['Moradia T2 renovada', 'compra', 98000, 'Sendim', 2, 'Moradia térrea renovada, painéis solares e garagem. Pronta a habitar.', 'Imobiliária Planalto · 273 000 701', 'moradia'],
    ];
    houses.forEach(h => run(`INSERT INTO houses (territory_id,title,kind,price,location,bedrooms,description,contact,photo) VALUES (?,?,?,?,?,?,?,?,?)`, terr, ...h));

    // Apoios municipais (descritivos fictícios para demonstração)
    const supports = [
      ['Apoio à fixação de novos residentes', 'Apoio financeiro único para agregados que fixem residência permanente no concelho, majorado por cada filho em idade escolar.', 'https://www.cm-mdouro.pt'],
      ['Programa de arrendamento acessível', 'Comparticipação mensal da renda durante os primeiros 12 meses para quem se muda para uma aldeia do concelho.', 'https://www.cm-mdouro.pt'],
      ['Reabilitação de casas nas aldeias', 'Apoio técnico gratuito e comparticipação em obras de recuperação de habitação própria permanente.', 'https://www.cm-mdouro.pt'],
      ['Transporte escolar e manuais gratuitos', 'Transporte gratuito entre as aldeias e as escolas do agrupamento, do pré-escolar ao secundário.', 'https://www.cm-mdouro.pt'],
    ];
    supports.forEach(s => run(`INSERT INTO municipal_supports (territory_id,title,description,url) VALUES (?,?,?,?)`, terr, ...s));

    // Participantes
    const P = (email, name, phone, city, ws, days, household, interest, bio) =>
      run(`INSERT INTO users (email,password_hash,role,name,phone,city,work_situation,remote_days,household,move_interest,bio,consent_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now','-40 days'),datetime('now','-40 days'))`,
        email, pw, 'participante', name, phone, city, ws, days, household, interest, bio).lastInsertRowid;

    const marta = P('marta@exemplo.pt', 'Marta Lopes', '910 000 001', 'Lisboa', 'freelancer', 5, 'Vivo sozinha', 3, 'Designer de produto. Quero perceber se consigo trabalhar bem longe da cidade.');
    const rui = P('rui@exemplo.pt', 'Rui Teixeira', '910 000 002', 'Porto', 'startup', 5, 'Vivo com a minha companheira', 4, 'Engenheiro de software numa startup totalmente remota.');
    const sofia = P('sofia@exemplo.pt', 'Sofia Antunes', '910 000 003', 'Amadora', 'profissional', 4, 'Companheiro e dois filhos (5 e 9 anos)', 5, 'Gestora de projetos. Queremos sair da cidade antes de o mais novo entrar na primária.');
    const tiago = P('tiago@exemplo.pt', 'Tiago Moreira', '910 000 004', 'Vila Nova de Gaia', 'freelancer', 5, null, 4, 'Consultor de comunicação.');

    const E = (u, phase, arr, dep, interestEnd) =>
      run(`INSERT INTO enrollments (user_id,edition_id,phase,arrival,departure,interest_end) VALUES (?,?,?,?,?,?)`, u, ed, phase, arr, dep, interestEnd);
    E(marta, 'preparar', isoDay(6), isoDay(27), null);
    E(rui, 'integrar', isoDay(-10), isoDay(11), null);
    E(sofia, 'mudar', isoDay(-110), isoDay(-89), 5);
    E(tiago, 'decidir', isoDay(-200), isoDay(-179), 4);

    // Marta: videochamada marcada
    run(`INSERT INTO welcome_calls (user_id,host_id,datetime,note,link,status) VALUES (?,?,?,?,?,?)`, marta, host, isoDateTime(2, '18:00'), 'Gostava de saber como é o cowork e se há ginásio perto.', 'https://meet.example.org/ponte-marta', 'confirmada');
    run(`INSERT INTO welcome_calls (user_id,host_id,datetime,note,status) VALUES (?,?,?,?,?)`, rui, host, isoDateTime(-15, '12:30'), null, 'realizada');

    // Rui: inscrições, diário
    run(`INSERT INTO activity_signups (activity_id,user_id) VALUES (?,?)`, actIds[0], rui);
    run(`INSERT INTO activity_signups (activity_id,user_id) VALUES (?,?)`, actIds[3], rui);
    run(`INSERT INTO diary_entries (user_id,kind,body,created_at) VALUES (?,?,?,datetime('now','-8 days'))`, rui, 'gostei', 'A internet aguenta bem as chamadas com a equipa. Trabalho mais concentrado do que em casa.');
    run(`INSERT INTO diary_entries (user_id,kind,body,created_at) VALUES (?,?,?,datetime('now','-5 days'))`, rui, 'preocupa', 'A minha companheira é enfermeira. Não sei se haveria trabalho para ela aqui perto.');
    run(`INSERT INTO diary_entries (user_id,kind,body,created_at) VALUES (?,?,?,datetime('now','-2 days'))`, rui, 'gostei', 'O almoço de domingo foi o melhor da semana. As pessoas perguntaram-me logo se eu ficava.');

    // Planos de mudança
    const plan = (u) => run(`INSERT INTO move_plans (user_id) VALUES (?)`, u).lastInsertRowid;
    const T = (pid, area, title, status, due, notes, pos) =>
      run(`INSERT INTO tasks (plan_id,area,title,status,due_date,notes,position) VALUES (?,?,?,?,?,?,?)`, pid, area, title, status, due, notes, pos);

    const ps = plan(sofia);
    T(ps, 'casa', 'Visitar a casa de pedra em Sendim', 'feito', isoDay(-60), 'Gostámos muito. Falta ver o aquecimento.', 1);
    T(ps, 'casa', 'Negociar contrato de arrendamento', 'em_curso', isoDay(14), 'Proprietário aceita começar em janeiro.', 2);
    T(ps, 'apoios', 'Reunião no Gabinete de Novos Residentes', 'feito', isoDay(-45), 'Elegíveis para o apoio à fixação e para o arrendamento acessível.', 1);
    T(ps, 'apoios', 'Entregar candidatura ao apoio à fixação', 'por_fazer', isoDay(30), 'Precisa do contrato de arrendamento.', 2);
    T(ps, 'escola', 'Visitar o agrupamento e falar com a direção', 'feito', isoDay(-40), null, 1);
    T(ps, 'escola', 'Pedir transferência escolar do filho mais velho', 'em_curso', isoDay(20), null, 2);
    T(ps, 'escola', 'Inscrever o mais novo no jardim de infância', 'por_fazer', isoDay(35), null, 3);
    T(ps, 'emprego', 'Mapear oportunidades para o companheiro (técnico de manutenção)', 'feito', isoDay(-30), 'Leonor sugeriu a cooperativa e a barragem.', 1);
    T(ps, 'emprego', 'Entrevista na Cooperativa Agrícola', 'por_fazer', isoDay(10), null, 2);

    const pt = plan(tiago);
    T(pt, 'casa', 'Encontrar casa para arrendar', 'feito', isoDay(-120), null, 1);
    T(pt, 'apoios', 'Candidatura ao apoio à fixação', 'feito', isoDay(-100), 'Aprovada.', 1);
    T(pt, 'escola', 'Sem filhos, não se aplica', 'feito', null, null, 1);
    T(pt, 'emprego', 'Registar atividade e ligar-se ao cowork', 'feito', isoDay(-110), null, 1);

    // Mensagens
    const M = (f, t, body, ago) => run(`INSERT INTO messages (from_id,to_id,body,created_at,read_at) VALUES (?,?,?,datetime('now',?),datetime('now',?))`, f, t, body, ago, ago);
    M(host, marta, 'Olá Marta! Sou a Leonor, vou ser a tua anfitriã. Já marquei a nossa videochamada para quinta. Se tiveres alguma dúvida antes, escreve-me aqui.', '-3 days');
    M(marta, host, 'Olá Leonor, obrigada! Há algum sítio para correr perto da casa?', '-2 days');
    M(host, marta, 'Há! O caminho para as arribas é ótimo de manhã cedo. Mostro-te no primeiro dia.', '-2 days');
    M(rui, host, 'Leonor, a caminhada de sábado ainda tem lugar para mais uma pessoa? A Ana vem visitar-me.', '-1 days');
    M(host, rui, 'Tem sim, inscreve-a comigo quando chegarem. Vai gostar.', '-1 days');
    M(sofia, host, 'Olá Leonor, o proprietário já respondeu sobre janeiro?', '-19 days');
    M(host, sofia, 'Respondeu que sim! Falo contigo esta semana para fecharmos isso.', '-18 days');
    M(tiago, host, 'Já tenho o contrato assinado. Obrigado por tudo!', '-60 days');

    // Registos de contacto
    const C = (p, date, type, summary) => run(`INSERT INTO contact_logs (host_id,participant_id,date,type,summary) VALUES (?,?,?,?,?)`, host, p, date, type, summary);
    C(marta, isoDay(-3), 'mensagem', 'Primeiro contacto. Videochamada marcada.');
    C(rui, isoDay(-1), 'presencial', 'Conversa no cowork. Preocupado com o emprego da companheira (enfermeira).');
    C(sofia, isoDay(-18), 'telefone', 'Proprietário aceita contrato a partir de janeiro. Falta tratar da candidatura ao apoio.');
    C(sofia, isoDay(-45), 'presencial', 'Acompanhei a reunião no gabinete da câmara.');
    C(tiago, isoDay(-30), 'telefone', 'Fecho do acompanhamento. Mudou-se e quer ser embaixador.');

    run(`INSERT INTO host_notes (participant_id,host_id,body) VALUES (?,?,?)`, sofia, host, 'Família muito decidida. O ponto crítico é o emprego do companheiro. Apresentar ao Sr. Armando, que conhece toda a gente na barragem.');
    run(`INSERT INTO host_notes (participant_id,host_id,body) VALUES (?,?,?)`, rui, host, 'Falar com o centro de saúde sobre vagas de enfermagem na região.');

    // Visitas de regresso
    run(`INSERT INTO visits (user_id,date,nights,purpose,status) VALUES (?,?,?,?,?)`, sofia, isoDay(-60), 3, 'Ver casas e visitar a escola com as crianças', 'realizada');
    run(`INSERT INTO visits (user_id,date,nights,purpose,status) VALUES (?,?,?,?,?)`, sofia, isoDay(12), 2, 'Assinar o contrato e entrevista do companheiro', 'confirmada');

    // Decisão do Tiago + testemunhos
    run(`INSERT INTO decisions (user_id,choice,ambassador,moved_at,locality,notes) VALUES (?,?,?,?,?,?)`, tiago, 'mudei', 1, isoDay(-115), 'Sendim', 'Arrendei casa em Sendim e trabalho a partir do cowork.');
    run(`INSERT INTO testimonials (user_id,author_name,author_role,territory_id,body,status) VALUES (?,?,?,?,?,?)`, tiago, 'Tiago Moreira', 'Consultor de comunicação, mudou-se para Sendim', terr,
      'Vim por três semanas para ver se aguentava o silêncio. Seis meses depois tinha casa, uma rotina e amigos na aldeia. A Leonor foi decisiva: abriu-me portas que eu nunca ia encontrar sozinho.', 'pendente');
    // Embaixadores anteriores (antigos participantes de Rural Experiences)
    run(`INSERT INTO testimonials (author_name,author_role,territory_id,body,status) VALUES (?,?,?,?,?)`, 'Helena Sousa', 'Programadora, participou em 2024', terr,
      'Tinha medo da internet e foi a menor das preocupações. O que me surpreendeu foi a forma como a aldeia nos recebeu. Ao fim de uma semana já me chamavam pelo nome no café.', 'aprovado');
    run(`INSERT INTO testimonials (author_name,author_role,territory_id,body,status) VALUES (?,?,?,?,?)`, 'Duarte e Carla Mendes', 'Casal com uma filha, mudaram-se em 2025', terr,
      'Fizemos a experiência com a nossa filha de 6 anos. A escola tem turmas pequenas e ela adaptou-se melhor do que nós. Voltámos a Lisboa só para fazer as malas.', 'aprovado');
    run(`INSERT INTO testimonials (author_name,author_role,territory_id,body,status) VALUES (?,?,?,?,?)`, 'Nuno Barros', 'Designer, volta em visitas', terr,
      'Ainda não me mudei, mas volto todas as estações. Ter alguém do lado de lá que nos responde ao telefone faz toda a diferença.', 'aprovado');

    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { open, hashPassword, verifyPassword, DB_FILE };
