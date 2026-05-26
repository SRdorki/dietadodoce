require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const COURSE_FILE = path.join(__dirname, 'course_data.json');
const BONUS_FILE = path.join(__dirname, 'bonus_data.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// In-memory log of received webhooks (for debugging)
const webhookLogs = [];

// Initialize Supabase Client if configured
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("🟢 Conexão com o Supabase inicializada com sucesso!");
  } catch (error) {
    console.error("🔴 Erro ao inicializar cliente Supabase:", error);
  }
} else {
  console.log("ℹ️ Supabase não configurado no .env. Usando banco de dados local (JSON) como fallback.");
}

// Helper to read users from local file (fallback)
function readUsersLocal() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const defaultUsers = [
        {
          name: "Aluna VIP",
          email: process.env.DEFAULT_ALUNO_EMAIL || "aluno@dietadodoce.com.br",
          password: process.env.DEFAULT_ALUNO_PASSWORD || "doce123",
          status: "active",
          createdAt: new Date().toISOString(),
          origin: "manual",
          role: "student"
        },
        {
          name: "Administrador",
          email: process.env.ADMIN_EMAIL || "admin@dietadodoce.com.br",
          password: process.env.ADMIN_PASSWORD || "admin123",
          status: "active",
          createdAt: new Date().toISOString(),
          origin: "manual",
          role: "admin"
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
      return defaultUsers;
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error("Erro ao ler users.json:", error);
    return [];
  }
}

// Helper to write users to local file (fallback)
function writeUsersLocal(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error("Erro ao gravar users.json:", error);
    return false;
  }
}

// ================= UNIVERSAL DB CRUD UTILITIES (HYBRID) =================

// 1. Get All Users
async function dbGetUsers() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data.map(u => ({
        name: u.name,
        email: u.email,
        password: u.password,
        status: u.status,
        createdAt: u.created_at,
        origin: u.origin,
        role: u.role,
        achievements: u.achievements || []
      }));
    } catch (err) {
      console.error("Erro ao buscar usuários do Supabase:", err);
      // Fallback if supabase query fails
      return readUsersLocal();
    }
  }
  return readUsersLocal();
}

// 2. Find User by Email
async function dbFindUser(email) {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail);
      if (error) throw error;
      if (data && data.length > 0) {
        const u = data[0];
        return {
          name: u.name,
          email: u.email,
          password: u.password,
          status: u.status,
          createdAt: u.created_at,
          origin: u.origin,
          role: u.role,
          achievements: u.achievements || []
        };
      }
      return null;
    } catch (err) {
      console.error("Erro ao buscar usuário por e-mail no Supabase:", err);
    }
  }
  
  const users = readUsersLocal();
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail);
  return found || null;
}

// 3. Create or Save User
async function dbCreateUser(userData) {
  const normalizedEmail = userData.email.toLowerCase();
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: normalizedEmail,
          password: userData.password || 'doce123',
          status: userData.status || 'active',
          origin: userData.origin || 'manual',
          role: userData.role || 'student',
          achievements: userData.achievements || [],
          created_at: userData.createdAt || new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      if (data && data.length > 0) {
        const u = data[0];
        return {
          name: u.name,
          email: u.email,
          password: u.password,
          status: u.status,
          createdAt: u.created_at,
          origin: u.origin,
          role: u.role,
          achievements: u.achievements || []
        };
      }
    } catch (err) {
      console.error("Erro ao criar usuário no Supabase:", err);
    }
  }
  
  const users = readUsersLocal();
  const existsIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  const newUser = {
    name: userData.name,
    email: normalizedEmail,
    password: userData.password || 'doce123',
    status: userData.status || 'active',
    createdAt: userData.createdAt || new Date().toISOString(),
    origin: userData.origin || 'manual',
    role: userData.role || 'student',
    achievements: userData.achievements || []
  };
  
  if (existsIndex >= 0) {
    users[existsIndex] = { ...users[existsIndex], ...newUser };
  } else {
    users.push(newUser);
  }
  writeUsersLocal(users);
  return newUser;
}

// 4. Update User Status
async function dbUpdateUserStatus(email, newStatus) {
  const normalizedEmail = email.toLowerCase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('email', normalizedEmail)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        const u = data[0];
        return {
          name: u.name,
          email: u.email,
          password: u.password,
          status: u.status,
          createdAt: u.created_at,
          origin: u.origin,
          role: u.role,
          achievements: u.achievements || []
        };
      }
    } catch (err) {
      console.error("Erro ao atualizar status do usuário no Supabase:", err);
    }
  }
  
  const users = readUsersLocal();
  const idx = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  if (idx >= 0) {
    users[idx].status = newStatus;
    users[idx].updatedAt = new Date().toISOString();
    writeUsersLocal(users);
    return users[idx];
  }
  return null;
}

async function dbUpdateUserAchievements(email, achievements) {
  const normalizedEmail = email.toLowerCase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ achievements })
        .eq('email', normalizedEmail)
        .select();
      if (error) throw error;
      if (data && data.length > 0) return true;
    } catch (err) {
      console.error("Erro ao atualizar conquistas no Supabase:", err);
    }
  }
  
  const users = readUsersLocal();
  const idx = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  if (idx >= 0) {
    users[idx].achievements = achievements;
    users[idx].updatedAt = new Date().toISOString();
    writeUsersLocal(users);
    return true;
  }
  return false;
}

// 5. Delete User
async function dbDeleteUser(email) {
  const normalizedEmail = email.toLowerCase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', normalizedEmail);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Erro ao excluir usuário no Supabase:", err);
    }
  }
  
  const users = readUsersLocal();
  const filtered = users.filter(u => u.email.toLowerCase() !== normalizedEmail);
  if (users.length !== filtered.length) {
    writeUsersLocal(filtered);
    return true;
  }
  return false;
}

// ================= CONFIGURAÇÃO DO ADMINISTRADOR (HYBRID PERSISTENCE) =================
const ADMIN_CONFIG_FILE = path.join(__dirname, 'admin_config.json');

// Local Config Fallback
function readAdminConfigLocal() {
  try {
    if (!fs.existsSync(ADMIN_CONFIG_FILE)) {
      const defaultConfig = {
        blockedElements: [],
        adminAnnouncement: ""
      };
      fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    const data = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error("Erro ao ler admin_config.json local:", error);
    return { blockedElements: [], adminAnnouncement: "" };
  }
}

function writeAdminConfigLocal(config) {
  try {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Erro ao gravar admin_config.json local:", error);
    return false;
  }
}

// Get Config
async function dbGetAdminConfig() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('*')
        .eq('id', 1);
      if (error) throw error;
      if (data && data.length > 0) {
        return {
          blockedElements: data[0].blocked_elements || [],
          adminAnnouncement: data[0].admin_announcement || ""
        };
      }
    } catch (err) {
      console.error("Erro ao obter configuração do Supabase:", err);
    }
  }
  return readAdminConfigLocal();
}

// Save Config
async function dbSaveAdminConfig(config) {
  const blockedElements = config.blockedElements || [];
  const adminAnnouncement = config.adminAnnouncement || "";
  
  if (supabase) {
    try {
      const { error } = await supabase
        .from('admin_config')
        .upsert({
          id: 1,
          blocked_elements: blockedElements,
          admin_announcement: adminAnnouncement
        });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Erro ao gravar configuração no Supabase:", err);
    }
  }
  return writeAdminConfigLocal({ blockedElements, adminAnnouncement });
}

// ================= COURSE DATA CRUD (HYBRID) =================

// Default course data (pre-populate on first load)
const DEFAULT_COURSE_DATA = [
  {
    title: "Módulo de Boas-Vindas",
    sort_order: 0,
    lessons: [{ title: "Bem-vinda à sua Nova Vida Doce!", duration: "5 min", iframe_url: "", conclusion: "Você está prestes a quebrar o ciclo de restrição e culpa.", rationale: "Fazer o login e encarar a dieta com leveza ativa a dopamina de progresso.", steps: ["Assista a este vídeo completo de onboarding.", "Baixe o Caderno de Atividades.", "Escreva sua primeira vitória."], attachments: [], sort_order: 0 }]
  },
  {
    title: "Módulo 1: O Fim do Terrorismo Nutricional",
    sort_order: 1,
    lessons: [
      { title: "1.1 O Efeito do Proibido e a Restrição", duration: "8 min", iframe_url: "", conclusion: "Cortar totalmente o doce cria o 'efeito do proibido'.", rationale: "A privação extrema aumenta a grelina e o cortisol.", steps: ["Pare de rotular doces como 'vilões'.", "Adote a inclusão estratégica de doces saudáveis."], attachments: [], sort_order: 0 },
      { title: "1.2 Entendendo seus Hormônios: Grelina e Cortisol", duration: "10 min", iframe_url: "", conclusion: "O estresse sabota sua fisiologia.", rationale: "O cortisol alto altera os receptores de dopamina.", steps: ["Identifique os momentos de maior estresse.", "Faça o exercício S.T.O.P.", "Garanta sono de qualidade de 7 a 8 horas."], attachments: [], sort_order: 1 },
      { title: "1.3 O Ritual da Autocompaixão e do Alívio", duration: "7 min", iframe_url: "", conclusion: "Se escorregar na alimentação, perdoe-se imediatamente.", rationale: "Dietas rígidas focam em punição.", steps: ["Se cometer um excesso, tome 2 copos de água e perdoe-se.", "Jamais faça compensações com jejum severo.", "Volte para a próxima refeição como se nada tivesse acontecido."], attachments: [], sort_order: 2 }
    ]
  }
];

// Local JSON fallback for course
function readCourseLocal() {
  try {
    if (!fs.existsSync(COURSE_FILE)) {
      fs.writeFileSync(COURSE_FILE, JSON.stringify(DEFAULT_COURSE_DATA, null, 2));
      return DEFAULT_COURSE_DATA;
    }
    const data = fs.readFileSync(COURSE_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Erro ao ler course_data.json:", err);
    return DEFAULT_COURSE_DATA;
  }
}

function writeCourseLocal(data) {
  try {
    fs.writeFileSync(COURSE_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Erro ao escrever course_data.json:", err);
    return false;
  }
}

// Local JSON fallback for bonuses
function readBonusLocal() {
  try {
    if (!fs.existsSync(BONUS_FILE)) return [];
    const data = fs.readFileSync(BONUS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Erro ao ler bonus_data.json:", err);
    return [];
  }
}

function writeBonusLocal(data) {
  try {
    fs.writeFileSync(BONUS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Erro ao escrever bonus_data.json:", err);
    return false;
  }
}

// Get full course (modules + lessons)
async function dbGetCourse() {
  if (supabase) {
    try {
      const { data: modules, error: mErr } = await supabase
        .from('course_modules')
        .select('*')
        .order('sort_order', { ascending: true });
      if (mErr) throw mErr;

      if (!modules || modules.length === 0) {
        // Seed from defaults on first use
        await seedCourseToSupabase();
        return dbGetCourse();
      }

      const { data: lessons, error: lErr } = await supabase
        .from('course_lessons')
        .select('*')
        .order('sort_order', { ascending: true });
      if (lErr) throw lErr;

      return modules.map(m => ({
        id: m.id,
        title: m.title,
        sort_order: m.sort_order,
        lessons: (lessons || []).filter(l => l.module_id === m.id).map(l => ({
          id: l.id,
          module_id: l.module_id,
          title: l.title,
          duration: l.duration,
          iframe_url: l.iframe_url || '',
          conclusion: l.conclusion || '',
          rationale: l.rationale || '',
          steps: l.steps || [],
          attachments: l.attachments || [],
          sort_order: l.sort_order
        }))
      }));
    } catch (err) {
      console.error("Erro ao buscar curso do Supabase:", err);
    }
  }
  return readCourseLocal();
}

async function seedCourseToSupabase() {
  try {
    for (let mi = 0; mi < DEFAULT_COURSE_DATA.length; mi++) {
      const mod = DEFAULT_COURSE_DATA[mi];
      const { data: mData, error: mErr } = await supabase
        .from('course_modules')
        .insert([{ title: mod.title, sort_order: mi }])
        .select();
      if (mErr || !mData) continue;
      const moduleId = mData[0].id;
      for (let li = 0; li < (mod.lessons || []).length; li++) {
        const les = mod.lessons[li];
        await supabase.from('course_lessons').insert([{
          module_id: moduleId,
          title: les.title,
          duration: les.duration || '10 min',
          iframe_url: les.iframe_url || '',
          conclusion: les.conclusion || '',
          rationale: les.rationale || '',
          steps: les.steps || [],
          attachments: les.attachments || [],
          sort_order: li
        }]);
      }
    }
    console.log("✅ Curso semeado no Supabase com dados padrão.");
  } catch (err) {
    console.error("Erro ao semear curso no Supabase:", err);
  }
}
// --- BONUSES DB HELPERS ---
async function dbGetBonuses() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('course_bonuses').select('*').order('id', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        await seedBonusesToSupabase();
        return dbGetBonuses();
      }
      return data;
    } catch (err) {
      console.error("Erro ao buscar bônus do Supabase:", err);
    }
  }
  return readBonusLocal();
}

async function seedBonusesToSupabase() {
  try {
    const defaults = readBonusLocal();
    if (defaults.length === 0) return;
    for (const b of defaults) {
      await supabase.from('course_bonuses').insert([{
        title: b.title,
        description: b.description,
        icon: b.icon,
        unlock_hint: b.unlock_hint,
        unlock_achievement_id: b.unlock_achievement_id,
        file_url: b.file_url || '',
        action_text: b.action_text || ''
      }]);
    }
    console.log("✅ Bônus semeados no Supabase com dados padrão.");
  } catch (err) {
    console.error("Erro ao semear bônus no Supabase:", err);
  }
}

async function dbCreateBonus(bonus) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('course_bonuses').insert([bonus]).select();
      if (error) throw error;
      return data[0];
    } catch (err) { console.error("Erro ao criar bônus:", err); }
  }
  const local = readBonusLocal();
  const newBonus = { id: Date.now(), ...bonus };
  local.push(newBonus);
  writeBonusLocal(local);
  return newBonus;
}

async function dbUpdateBonus(id, bonus) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('course_bonuses').update(bonus).eq('id', id).select();
      if (error) throw error;
      return data[0];
    } catch (err) { console.error("Erro ao atualizar bônus:", err); }
  }
  const local = readBonusLocal();
  const index = local.findIndex(b => String(b.id) === String(id));
  if (index !== -1) {
    local[index] = { ...local[index], ...bonus };
    writeBonusLocal(local);
    return local[index];
  }
  return null;
}

async function dbDeleteBonus(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('course_bonuses').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) { console.error("Erro ao excluir bônus:", err); }
  }
  const local = readBonusLocal();
  const filtered = local.filter(b => String(b.id) !== String(id));
  writeBonusLocal(filtered);
  return true;
}
// --- FIM BONUSES DB HELPERS ---

// Create Module
async function dbCreateModule(title, sort_order) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .insert([{ title, sort_order: sort_order || 0 }])
        .select();
      if (error) throw error;
      return data[0];
    } catch (err) { console.error("Erro ao criar módulo:", err); }
  }
  const local = readCourseLocal();
  const newMod = { id: Date.now(), title, sort_order: sort_order || local.length, lessons: [] };
  local.push(newMod);
  writeCourseLocal(local);
  return newMod;
}

// Update Module
async function dbUpdateModule(id, title) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .update({ title })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (err) { console.error("Erro ao editar módulo:", err); }
  }
  const local = readCourseLocal();
  const mod = local.find(m => m.id == id);
  if (mod) { mod.title = title; writeCourseLocal(local); }
  return mod;
}

// Delete Module
async function dbDeleteModule(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('course_modules').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) { console.error("Erro ao deletar módulo:", err); }
  }
  let local = readCourseLocal();
  local = local.filter(m => m.id != id);
  writeCourseLocal(local);
  return true;
}

// Create Lesson
async function dbCreateLesson(lessonData) {
  const { module_id, title, duration, iframe_url, conclusion, rationale, steps, attachments, sort_order } = lessonData;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .insert([{ module_id, title, duration: duration || '10 min', iframe_url: iframe_url || '', conclusion: conclusion || '', rationale: rationale || '', steps: steps || [], attachments: attachments || [], sort_order: sort_order || 0 }])
        .select();
      if (error) throw error;
      return data[0];
    } catch (err) { console.error("Erro ao criar aula:", err); }
  }
  const local = readCourseLocal();
  const mod = local.find(m => m.id == module_id);
  if (!mod) return null;
  const newLesson = { id: Date.now(), module_id, title, duration: duration || '10 min', iframe_url: iframe_url || '', conclusion: conclusion || '', rationale: rationale || '', steps: steps || [], attachments: attachments || [], sort_order: sort_order || (mod.lessons || []).length };
  if (!mod.lessons) mod.lessons = [];
  mod.lessons.push(newLesson);
  writeCourseLocal(local);
  return newLesson;
}

// Update Lesson
async function dbUpdateLesson(id, lessonData) {
  const { title, duration, iframe_url, conclusion, rationale, steps, attachments } = lessonData;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .update({ title, duration, iframe_url: iframe_url || '', conclusion, rationale, steps, attachments })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (err) { console.error("Erro ao editar aula:", err); }
  }
  const local = readCourseLocal();
  for (const mod of local) {
    const les = (mod.lessons || []).find(l => l.id == id);
    if (les) {
      Object.assign(les, { title, duration, iframe_url: iframe_url || '', conclusion, rationale, steps, attachments });
      writeCourseLocal(local);
      return les;
    }
  }
  return null;
}

// Delete Lesson
async function dbDeleteLesson(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('course_lessons').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) { console.error("Erro ao deletar aula:", err); }
  }
  const local = readCourseLocal();
  for (const mod of local) {
    const idx = (mod.lessons || []).findIndex(l => l.id == id);
    if (idx >= 0) {
      mod.lessons.splice(idx, 1);
      writeCourseLocal(local);
      return true;
    }
  }
  return false;
}

// ================= COMMENTS CRUD (HYBRID) =================

const COMMENTS_FILE = path.join(__dirname, 'comments.json');

// Local JSON fallback for comments
function readCommentsLocal() {
  try {
    if (!fs.existsSync(COMMENTS_FILE)) {
      fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Erro ao ler comments.json:", err);
    return [];
  }
}

function writeCommentsLocal(comments) {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
    return true;
  } catch (err) {
    console.error("Erro ao escrever comments.json:", err);
    return false;
  }
}

// Get comments for a specific lesson
async function dbGetComments(lessonId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('lesson_id', String(lessonId))
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Erro ao buscar comentários do Supabase:", err);
    }
  }
  const comments = readCommentsLocal();
  return comments.filter(c => String(c.lesson_id) === String(lessonId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Create comment
async function dbCreateComment(commentData) {
  const { lesson_id, user_email, user_name, comment_text } = commentData;
  const created_at = new Date().toISOString();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ lesson_id: String(lesson_id), user_email, user_name, comment_text, created_at }])
        .select();
      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error("Erro ao criar comentário no Supabase:", err);
    }
  }

  const comments = readCommentsLocal();
  const newComment = {
    id: Date.now(),
    lesson_id: String(lesson_id),
    user_email,
    user_name,
    comment_text,
    created_at
  };
  comments.push(newComment);
  writeCommentsLocal(comments);
  return newComment;
}

// Delete comment
async function dbDeleteComment(commentId, userEmail) {
  if (supabase) {
    try {
      // Only allow deletion if comment belongs to user
      const { data: comment } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .single();

      if (!comment || comment.user_email !== userEmail) {
        return { success: false, error: 'Não autorizado' };
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Erro ao deletar comentário no Supabase:", err);
      return { success: false, error: err.message };
    }
  }

  const comments = readCommentsLocal();
  const index = comments.findIndex(c => String(c.id) === String(commentId) && c.user_email === userEmail);
  if (index >= 0) {
    comments.splice(index, 1);
    writeCommentsLocal(comments);
    return { success: true };
  }
  return { success: false, error: 'Comentário não encontrado ou não autorizado' };
}

// ================= EXPRESS ROUTES =================

// Route: Get Webhook logs
app.get('/api/webhook-logs', (req, res) => {
  res.json(webhookLogs);
});

// Route: Clear Webhook logs
app.post('/api/webhook-logs/clear', (req, res) => {
  webhookLogs.length = 0;
  res.json({ message: "Logs de webhook limpos." });
});

// Route: User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  const user = await dbFindUser(email);

  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado. Se você acabou de comprar, aguarde a liberação do e-mail." });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: "Senha incorreta. A senha padrão de acesso é doce123." });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: "Sua conta está inativa ou pendente. Verifique o pagamento." });
  }

  res.json({
    success: true,
    message: "Login concedido com sucesso!",
    user: {
      name: user.name,
      email: user.email,
      role: user.role || 'student',
      createdAt: user.createdAt || user.created_at || new Date().toISOString(),
      achievements: user.achievements || []
    }
  });
});

// ----------------- WEBHOOK NORMALIZER -----------------
function normalizeWebhook(payload, gateway = 'unknown') {
  let email = payload.email || (payload.data && payload.data.buyer && payload.data.buyer.email) || payload.buyer_email;
  let name = payload.name || payload.first_name || (payload.data && payload.data.buyer && payload.data.buyer.name) || payload.buyer_name || "Aluna VIP";
  let status = payload.status || (payload.data && payload.data.purchase && payload.data.purchase.status) || payload.event;
  
  // Extração de objetos agrupados (ex: Eduzz/Monetizze)
  if (payload.buyer && typeof payload.buyer === 'object') {
    email = email || payload.buyer.email;
    name = name || payload.buyer.name;
  }

  // Identificação de aprovação (ativo)
  const isApproved = status && (
    status.toLowerCase() === 'approved' || 
    status.toLowerCase() === 'complete' || 
    status.toLowerCase() === 'paid' || 
    status.toLowerCase() === 'active' ||
    status.toLowerCase() === 'compra_aprovada'
  );

  // Identificação de inativação (reembolso/chargeback)
  const isRefunded = status && (
    status.toLowerCase() === 'refunded' || 
    status.toLowerCase() === 'chargeback' || 
    status.toLowerCase() === 'reembolsado' || 
    status.toLowerCase() === 'devolvido'
  );

  let internalStatus = 'ignored';
  if (isApproved) internalStatus = 'active';
  else if (isRefunded) internalStatus = 'inactive';

  // Extração de data de compra (para Drip Content e Gamificação)
  let purchaseDateRaw = payload.purchase_date || payload.creation_date || 
    (payload.data && payload.data.purchase && payload.data.purchase.approved_date) || 
    (payload.data && payload.data.purchase && payload.data.purchase.order_date);
  
  let purchaseDate = undefined;
  if (purchaseDateRaw) {
    const d = new Date(typeof purchaseDateRaw === 'number' && purchaseDateRaw.toString().length === 10 ? purchaseDateRaw * 1000 : purchaseDateRaw);
    if (!isNaN(d)) purchaseDate = d.toISOString();
  }

  // Extração de ID de Transação e Gateway
  const transactionId = payload.transaction || payload.transaction_id || 
    (payload.data && payload.data.purchase && payload.data.purchase.transaction);
    
  // Identificação heurística do gateway se 'unknown'
  let detectedGateway = gateway;
  if (gateway === 'unknown') {
    if (payload.hottok || payload.data?.product?.ucode) detectedGateway = 'hotmart';
    else if (payload.webhook_event_type) detectedGateway = 'kiwify';
    else if (payload.eduzz_token) detectedGateway = 'eduzz';
  }

  // Extração do ID do Produto (Order Bump / Upsell identificação)
  const productId = payload.product?.id || payload.product_id || payload.prod || (payload.data && payload.data.product && payload.data.product.id) || null;

  return {
    email: email ? email.toLowerCase() : null,
    name,
    originalStatus: status,
    internalStatus,
    purchaseDate,
    transactionId,
    productId: productId ? String(productId) : null,
    gateway: detectedGateway
  };
}

async function processWebhookData(req, res, gateway) {
  console.log(`=== Novo Webhook Recebido (${gateway}) ===`);
  
  // Validação de Segurança do Webhook
  const secretToken = process.env.WEBHOOK_SECRET_TOKEN;
  const isSimulated = req.headers['x-simulated-by'] === 'Front-End Debugger Panel';
  if (secretToken && !isSimulated) {
    const receivedToken = req.headers['x-webhook-token'] || req.query.token || req.query.hottok;
    if (receivedToken !== secretToken) {
      console.warn(`⚠️ Tentativa de Webhook não autorizada (${gateway})! Token inválido ou ausente.`);
      return res.status(401).json({ error: "Não autorizado: Token do webhook inválido ou ausente." });
    }
  }

  const payload = req.body;
  const receivedAt = new Date().toISOString();

  webhookLogs.unshift({ timestamp: receivedAt, headers: req.headers, body: payload });
  if (webhookLogs.length > 30) webhookLogs.pop();

  const standardizedData = normalizeWebhook(payload, gateway);
  console.log("Dados Normalizados:", standardizedData);

  if (!standardizedData.email) {
    return res.status(400).json({ success: false, message: "E-mail do comprador não foi encontrado no payload." });
  }

  const existingUser = await dbFindUser(standardizedData.email);

  const ORDER_BUMP_ID = '7816706';
  const ORDER_BUMP_ACHIEVEMENT = `order_bump_${ORDER_BUMP_ID}`;

  if (standardizedData.internalStatus === 'active') {
    if (existingUser) {
      if (standardizedData.productId === ORDER_BUMP_ID) {
        const currentAchievements = existingUser.achievements || [];
        if (!currentAchievements.includes(ORDER_BUMP_ACHIEVEMENT)) {
          currentAchievements.push(ORDER_BUMP_ACHIEVEMENT);
          await dbUpdateUserAchievements(standardizedData.email, currentAchievements);
          console.log(`Order Bump (${ORDER_BUMP_ID}) liberado para: ${standardizedData.email}`);
        }
      } else {
        await dbUpdateUserStatus(standardizedData.email, 'active');
        console.log(`Usuário existente ativado: ${standardizedData.email}`);
      }
    } else {
      const achievements = standardizedData.productId === ORDER_BUMP_ID ? [ORDER_BUMP_ACHIEVEMENT] : [];
      await dbCreateUser({
        name: standardizedData.name,
        email: standardizedData.email,
        password: "doce123",
        status: "active",
        createdAt: standardizedData.purchaseDate,
        origin: "webhook",
        role: "student",
        achievements: achievements
      });
      console.log(`Novo usuário registrado via Webhook: ${standardizedData.email}`);
    }
  } else if (standardizedData.internalStatus === 'inactive') {
    if (existingUser) {
      if (standardizedData.productId === ORDER_BUMP_ID) {
        const currentAchievements = existingUser.achievements || [];
        const newAchievements = currentAchievements.filter(a => a !== ORDER_BUMP_ACHIEVEMENT);
        await dbUpdateUserAchievements(standardizedData.email, newAchievements);
        console.log(`Order Bump (${ORDER_BUMP_ID}) bloqueado (estorno) para: ${standardizedData.email}`);
      } else {
        await dbUpdateUserStatus(standardizedData.email, 'inactive');
        console.log(`Usuário inativado devido a estorno/reembolso: ${standardizedData.email}`);
      }
    }
  } else {
  }

  res.json({ success: true, message: "Webhook processado via Normalizador Universal." });
}

// --------------------------------------------------------

// Rota Antiga para Retrocompatibilidade (ex: Hotmart)
app.post('/api/webhook/hotmart', async (req, res) => {
  await processWebhookData(req, res, 'hotmart');
});

// Nova Rota Genérica / Universal (pode receber Kiwify, Eduzz, Ticto etc)
app.post('/api/webhook/universal', async (req, res) => {
  await processWebhookData(req, res, 'unknown');
});

// Rota Dinâmica que aceita o nome da plataforma na URL (ex: /api/webhook/kiwify)
app.post('/api/webhook/:gateway', async (req, res) => {
  await processWebhookData(req, res, req.params.gateway);
});

// Route: Get Admin Config
app.get('/api/admin/config', async (req, res) => {
  const config = await dbGetAdminConfig();
  res.json(config);
});

// Route: Save Admin Config
app.post('/api/admin/config', async (req, res) => {
  const { blockedElements, adminAnnouncement } = req.body;
  const config = {
    blockedElements: blockedElements || [],
    adminAnnouncement: adminAnnouncement || ""
  };
  await dbSaveAdminConfig(config);
  res.json({ success: true, config });
});

// Route: Get All Users (Admin only)
app.get('/api/admin/users', async (req, res) => {
  const users = await dbGetUsers();
  res.json(users);
});

// Route: Create User Manually (Admin only)
app.post('/api/admin/users/create', async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
  }
  
  const exists = await dbFindUser(email);
  if (exists) {
    return res.status(400).json({ error: "Este e-mail já está cadastrado!" });
  }

  const newUser = await dbCreateUser({
    name,
    email,
    password: "doce123",
    status: "active",
    origin: "admin_manual",
    role: role || 'student'
  });
  
  res.json({ success: true, user: newUser });
});

// Route: Toggle User Status (Admin only)
app.post('/api/admin/users/toggle-status', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  const user = await dbFindUser(email);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const newStatus = user.status === 'active' ? 'inactive' : 'active';
  const updatedUser = await dbUpdateUserStatus(email, newStatus);
  
  res.json({ success: true, user: updatedUser });
});

// Route: Delete User (Admin only)
app.delete('/api/admin/users/:email', async (req, res) => {
  const { email } = req.params;
  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  const user = await dbFindUser(email);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ error: "Não é possível excluir a conta do Administrador!" });
  }

  const deleted = await dbDeleteUser(email);
  res.json({ success: true, message: "Usuário excluído com sucesso." });
});

// ================= COURSE API ROUTES =================

// GET: Full course data
app.get('/api/course', async (req, res) => {
  const course = await dbGetCourse();
  res.json(course);
});

// POST: Create module
app.post('/api/admin/course/modules', async (req, res) => {
  const { title, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: "Título é obrigatório." });
  const mod = await dbCreateModule(title, sort_order);
  res.json({ success: true, module: mod });
});

// PUT: Update module
app.put('/api/admin/course/modules/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Título é obrigatório." });
  const mod = await dbUpdateModule(id, title);
  res.json({ success: true, module: mod });
});

// DELETE: Delete module
app.delete('/api/admin/course/modules/:id', async (req, res) => {
  const { id } = req.params;
  await dbDeleteModule(id);
  res.json({ success: true });
});

// POST: Create lesson
app.post('/api/admin/course/lessons', async (req, res) => {
  const { module_id, title, duration, iframe_url, conclusion, rationale, steps, attachments, sort_order } = req.body;
  if (!module_id || !title) return res.status(400).json({ error: "module_id e título são obrigatórios." });
  const lesson = await dbCreateLesson({ module_id, title, duration, iframe_url, conclusion, rationale, steps, attachments, sort_order });
  res.json({ success: true, lesson });
});

// PUT: Update lesson
app.put('/api/admin/course/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { title, duration, iframe_url, conclusion, rationale, steps, attachments } = req.body;
  if (!title) return res.status(400).json({ error: "Título é obrigatório." });
  const lesson = await dbUpdateLesson(id, { title, duration, iframe_url, conclusion, rationale, steps, attachments });
  res.json({ success: true, lesson });
});

// DELETE: Delete lesson
app.delete('/api/admin/course/lessons/:id', async (req, res) => {
  const { id } = req.params;
  await dbDeleteLesson(id);
  res.json({ success: true });
});

// POST: Upload file attachment
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// ================= BONUS API ROUTES =================

app.get('/api/bonuses', async (req, res) => {
  const bonuses = await dbGetBonuses();
  res.json(bonuses);
});

app.post('/api/admin/bonuses', async (req, res) => {
  const { title, description, icon, unlock_hint, unlock_achievement_id, file_url, checkout_url, action_text, release_days } = req.body;
  if (!title) return res.status(400).json({ error: "Título é obrigatório." });
  const bonus = await dbCreateBonus({ title, description, icon, unlock_hint, unlock_achievement_id, file_url, checkout_url, action_text, release_days: release_days || 0 });
  res.json({ success: true, bonus });
});

app.put('/api/admin/bonuses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, icon, unlock_hint, unlock_achievement_id, file_url, checkout_url, action_text, release_days } = req.body;
  if (!title) return res.status(400).json({ error: "Título é obrigatório." });
  const bonus = await dbUpdateBonus(id, { title, description, icon, unlock_hint, unlock_achievement_id, file_url, checkout_url, action_text, release_days: release_days || 0 });
  res.json({ success: true, bonus });
});

app.delete('/api/admin/bonuses/:id', async (req, res) => {
  const { id } = req.params;
  await dbDeleteBonus(id);
  res.json({ success: true });
});

// ================= COMMENTS API ROUTES =================

// GET: Get ALL comments (for community feed)
app.get('/api/comments/all', async (req, res) => {
  try {
    let allComments = [];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100); // Limit to last 100 comments
        if (error) throw error;
        allComments = data || [];
      } catch (err) {
        console.error("Erro ao buscar todos os comentários do Supabase:", err);
      }
    }

    if (allComments.length === 0) {
      const comments = readCommentsLocal();
      allComments = comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100);
    }

    res.json(allComments);
  } catch (e) {
    console.error("Erro ao buscar todos os comentários:", e);
    res.status(500).json({ error: "Erro ao buscar comentários" });
  }
});

// GET: Get comments for a lesson
app.get('/api/lessons/:lessonId/comments', async (req, res) => {
  const { lessonId } = req.params;
  try {
    const comments = await dbGetComments(lessonId);
    res.json(comments);
  } catch (e) {
    console.error("Erro ao buscar comentários:", e);
    res.status(500).json({ error: "Erro ao buscar comentários" });
  }
});

// POST: Create a new comment
app.post('/api/lessons/:lessonId/comments', async (req, res) => {
  const { lessonId } = req.params;
  const { user_email, user_name, comment_text } = req.body;

  if (!user_email || !user_name || !comment_text) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  try {
    const comment = await dbCreateComment({
      lesson_id: lessonId,
      user_email,
      user_name,
      comment_text
    });
    res.json({ success: true, comment });
  } catch (e) {
    console.error("Erro ao criar comentário:", e);
    res.status(500).json({ error: "Erro ao criar comentário" });
  }
});

// DELETE: Delete a comment
app.delete('/api/comments/:commentId', async (req, res) => {
  const { commentId } = req.params;
  const { user_email } = req.body;

  if (!user_email) {
    return res.status(400).json({ error: "E-mail do usuário é obrigatório" });
  }

  try {
    const result = await dbDeleteComment(commentId, user_email);
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(403).json({ error: result.error });
    }
  } catch (e) {
    console.error("Erro ao deletar comentário:", e);
    res.status(500).json({ error: "Erro ao deletar comentário" });
  }
});

// Fallback Route: SPA support
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`ÁREA DE MEMBROS VIP - DIETA DO DOCE RODANDO COM SUCESSO!`);
  console.log(`URL Local: http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/api/webhook/hotmart`);
  console.log(`====================================================`);
});
