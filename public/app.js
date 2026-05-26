// ================= DATA STRUCTURES (MODULES & LESSONS) =================
// courseData is loaded dynamically from /api/course on startup
let courseData = [];
let bonusData = [];

// ================= APP STATE MANAGEMENT =================
let activeLesson = null; // Will be set after courseData is loaded
let commentsPollingInterval = null;
let communityPollingInterval = null;

let completedLessons = JSON.parse(localStorage.getItem('dd_completed_lessons')) || [];
let groceryChecklist = JSON.parse(localStorage.getItem('dd_grocery_checklist')) || Array(12).fill(false);
let satietyLogs = JSON.parse(localStorage.getItem('dd_satiety_logs')) || [];
let stopReflection = localStorage.getItem('dd_stop_reflection') || "";
let hasPurchasedMentoria = localStorage.getItem('dd_purchased_mentoria') === 'true';

// Active Playing Audio Simulator States
let activeAudios = {
  1: { element: null, playing: false, currentTime: 0, duration: 195, timer: null, speed: 1 },
  2: { element: null, playing: false, currentTime: 0, duration: 250, timer: null, speed: 1 },
  3: { element: null, playing: false, currentTime: 0, duration: 225, timer: null, speed: 1 }
};

// Simulated Video Player States
let videoPlaying = false;
let videoCurrentTime = 0;
let videoDuration = 300; // default (in seconds)
let videoTimer = null;
let videoSpeed = 1;

// Subtitles mapping per lesson
const videoSubtitlesData = {
  "onboarding": [
    { time: 0, text: "Olá, querida! Seja muito bem-vinda ao protocolo Dieta do Doce VIP! 🍫" },
    { time: 4, text: "Estou extremamente feliz de iniciar essa jornada de liberdade alimentar com você." },
    { time: 9, text: "Chega de se punir, sentir culpa ou seguir dietas restritivas que te fazem sofrer." },
    { time: 14, text: "O seu primeiro passo prático de hoje é preencher o Quiz de Nivelamento logo abaixo." },
    { time: 19, text: "Isso definirá o seu Perfil Metabólico Doce para personalizarmos sua jornada." },
    { time: 24, text: "Baixe seu material, monte sua despensa fit e prepare-se para emagrecer com prazer!" },
    { time: 29, text: "Assista até o fim para receber sua primeira medalha e desbloquear seus bônus. Vamos lá!" }
  ],
  "1-1": [
    { time: 0, text: "Módulo 1, Aula 1.1: O Efeito do Proibido e a Restrição Extrema. 🧠" },
    { time: 4, text: "Você sabia que proibir o doce é exatamente o que faz você desejar ele em dobro?" },
    { time: 9, text: "A ciência prova que a privação gera estresse e eleva o hormônio do cortisol." },
    { time: 14, text: "O cortisol alto altera os receptores de dopamina no cérebro." },
    { time: 19, text: "Por isso, você precisa de cargas cada vez maiores de açúcar para sentir prazer." },
    { time: 24, text: "A nossa estratégia de emagrecimento foca em acolhimento e no timing metabólico correto!" }
  ],
  "1-2": [
    { time: 0, text: "Aula 1.2: Entendendo a grelina e o estresse que sabota sua saciedade. 📈" },
    { time: 5, text: "Quando estamos estressadas, o corpo pede energia rápida para nos proteger." },
    { time: 10, text: "E o que é energia rápida? Açúcar refinado! Não se culpe, é biologia pura." },
    { time: 15, text: "Por isso, controlar o cortisol com pausas conscientes e chás é metade do seu emagrecimento." }
  ],
  "1-3": [
    { time: 0, text: "Aula 1.3: O Ritual da Autocompaixão e do Alívio Imediato. 🌿" },
    { time: 5, text: "Se escorregar na alimentação, perdoe-se imediatamente e beba 2 copos de água." },
    { time: 10, text: "A culpa engorda porque gera estresse; o acolhimento te coloca de volta aos trilhos." }
  ],
  "2-1": [
    { time: 0, text: "Módulo 2, Aula 2.1: O segredo da Sobremesa Inteligente. 🥗" },
    { time: 5, text: "Comer doces fits logo após refeições completas amortece o impacto de insulina." },
    { time: 10, text: "Fibras e proteínas magras no estômago criam uma barreira que desacelera a glicose!" }
  ],
  "2-2": [
    { time: 0, text: "Aula 2.2: O Pós-Treino - Açúcar como Energia Muscular. 🏋️" },
    { time: 5, text: "Após o exercício físico, seu músculo esgotado absorve açúcar sem precisar de picos de insulina!" },
    { time: 10, text: "O GLUT4 está ativo na membrana, canalizando a glicose direto para a reconstrução muscular!" }
  ],
  "2-3": [
    { time: 0, text: "Aula 2.3: O Mini-Prazer Planejado para Nutrir a Alma. 🍰" },
    { time: 5, text: "Ter uma refeição livre planejada mantém o prazer na rotina e aumenta a adesão em 300%!" },
    { time: 10, text: "Coma devagar com atenção plena, sentindo o sabor sem pressa e sem culpa." }
  ],
  "3-1": [
    { time: 0, text: "Módulo 3, Aula 3.1: Os 12 Ingredientes Mágicos da sua Despensa Fit. 🛒" },
    { time: 5, text: "Cacau 100%, farinha de aveia, eritritol e leite de amêndoas são seus maiores aliados." },
    { time: 10, text: "Ter os ingredientes em potes de vidro visíveis em casa impede compras compulsivas!" }
  ],
  "3-2": [
    { time: 0, text: "Aula 3.2: O Equilíbrio 80/20 na Prática Diária. ⚖️" },
    { time: 5, text: "80% da semana com doces fits nutritivos; 20% reservado para confraternizações sociais." },
    { time: 10, text: "Esqueça a perfeição absoluta; foque na consistência a longo prazo!" }
  ],
  "3-3": [
    { time: 0, text: "Aula 3.3: Ajustando seu Modelo - Do Iniciante ao Avançado. 📈" },
    { time: 5, text: "Escolha o modelo que se encaixa na sua rotina atual (ex: 1 doce fixo por dia ou intuitivo)." }
  ],
  "4-1": [
    { time: 0, text: "Módulo 4, Aula 4.1: O SOS TPM e a Receita do Brigadeiro Fit de Colher. 🍫" },
    { time: 5, text: "A queda de estrogênio na TPM derruba a serotonina. O cacau é rico em magnésio e acalma o útero." }
  ],
  "4-2": [
    { time: 0, text: "Aula 4.2: Resolvendo a Crise Noturna das 22h com Bolinho de Caneca Fit. 🌙" },
    { time: 5, text: "A fome noturna é ansiedade pura. Faça o bolinho de banana e aveia em 2 minutos." }
  ],
  "4-3": [
    { time: 0, text: "Aula 4.3: O Damage Control - O Protocolo do Dia Seguinte. 🛡️" },
    { time: 5, text: "Exagerou? Nada de jejuns malucos. Beba 1L de água e consuma proteínas no café da manhã!" }
  ]
};

// ================= DOM ELEMENTS =================
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginErrorMsg = document.getElementById('login-error-msg');

const welcomeTitle = document.getElementById('welcome-title');
const userDisplayName = document.getElementById('user-display-name');
const userDisplayEmail = document.getElementById('user-display-email');
const userAvatarInitials = document.getElementById('user-avatar-initials');
const logoutBtn = document.getElementById('logout-btn');

const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercent = document.getElementById('progress-percent');
const progressCount = document.getElementById('progress-count');

const tabButtons = document.querySelectorAll('.nav-tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

const moduleAccordion = document.getElementById('module-accordion');

// Lesson Player elements
const playerLessonTitle = document.getElementById('player-lesson-title');
const btnMarkComplete = document.getElementById('btn-mark-complete');
const lessonConclusionText = document.getElementById('lesson-conclusion-text');
const lessonRationaleText = document.getElementById('lesson-rationale-text');
const lessonActionList = document.getElementById('lesson-action-list');
const detailsTabButtons = document.querySelectorAll('.details-tab-btn');
const detailsTabPanels = document.querySelectorAll('.details-tab-panel');
const btnPostComment = document.getElementById('btn-post-comment');
const newCommentText = document.getElementById('new-comment-text');
const commentsListBox = document.getElementById('comments-list-box');

// Exercises Elements
const stopReflectionInput = document.getElementById('stop-reflection');
const btnSaveStop = document.getElementById('btn-save-stop');
const stopSavedToast = document.getElementById('stop-saved-toast');

const satietyForm = document.getElementById('satiety-form');
const satietyFoodInput = document.getElementById('satiety-food');
const satietyFeelingBeforeInput = document.getElementById('satiety-feeling-before');
const satietyFeelingAfterInput = document.getElementById('satiety-feeling-after');
const satietyLogsList = document.getElementById('satiety-logs-list');

const groceryChecklistItems = document.querySelectorAll('#grocery-checklist input');
const checklistPercent = document.getElementById('checklist-percent');
const checklistBarFill = document.getElementById('checklist-bar-fill');

// Webhook Simulator Elements
const webhookSimulatorForm = document.getElementById('webhook-simulator-form');
const simName = document.getElementById('sim-name');
const simEmail = document.getElementById('sim-email');
const simStatus = document.getElementById('sim-status');
const simPlatform = document.getElementById('sim-platform');
const webhookLogsConsole = document.getElementById('webhook-logs-console');
const btnClearWebhookLogs = document.getElementById('btn-clear-webhook-logs');

// ================= INITIALIZATION & AUTHENTICATION =================

// Load course data from API
async function loadCourseData() {
  try {
    const res = await fetch('/api/course');
    if (res.ok) {
      const data = await res.json();
      courseData.length = 0;
      data.forEach(m => courseData.push(m));
    }
  } catch (e) {
    console.error('Erro ao carregar dados do curso:', e);
  }
  // Set default activeLesson after loading
  if (!activeLesson && courseData.length > 0 && courseData[0].lessons && courseData[0].lessons.length > 0) {
    activeLesson = courseData[0].lessons[0];
  }
}

async function loadBonusData() {
  try {
    const res = await fetch('/api/bonuses');
    if (res.ok) {
      const data = await res.json();
      bonusData.length = 0;
      data.forEach(b => bonusData.push(b));
    }
  } catch (e) {
    console.error('Erro ao carregar dados de bônus:', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load course data first (dynamic from API)
  await loadCourseData();
  await loadBonusData();

  // Se mentoria já foi comprada, injeta módulo premium
  if (hasPurchasedMentoria) {
    injectMentoriaModule();
  }

  checkSession();
  setupTabNavigation();
  renderAccordion();
  loadLessonData(activeLesson);
  updateProgressBar();
  setupAudioPlayers();
  setupExercises();
  setupWebhookLogs();
  setupPremiumLXDEngine();
  
  // Schedule log update when on webhook panel
  setInterval(() => {
    const activeTab = document.querySelector('.nav-tab-btn.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'tab-webhook') {
      fetchWebhookLogs();
    }
  }, 5000);
});

// Check Session on Load
function checkSession() {
  const session = JSON.parse(sessionStorage.getItem('user_session'));
  if (session) {
    showApp(session.user);
  } else {
    showLogin();
  }
}

// Show App Interface
function showApp(user) {
  loginContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  
  welcomeTitle.textContent = `Bem-vinda de volta, ${user.name.split(' ')[0]}! 👋`;
  userDisplayName.textContent = user.name;
  userDisplayEmail.textContent = user.email;
  
  // Avatar Initials
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  userAvatarInitials.textContent = initials;

  // Lógica de Visualização do Admin e Desenvolvedor
  const adminBtn = document.getElementById('sidebar-admin-btn');
  const webhookBtn = document.getElementById('sidebar-webhook-btn');
  if (user.role === 'admin') {
    if (adminBtn) adminBtn.classList.remove('hidden');
    if (webhookBtn) webhookBtn.classList.remove('hidden');
    welcomeTitle.innerHTML = `Painel do Administrador <i class="fa-solid fa-screwdriver-wrench"></i> <span class="badge" style="background:var(--accent-honey); color:var(--bg-deep-cocoa);">ADMIN</span>`;
  } else {
    if (adminBtn) adminBtn.classList.add('hidden');
    if (webhookBtn) webhookBtn.classList.add('hidden');
  }

  // Carrega as configurações de bloqueio e comunicado
  loadAdminLocksAndAnnouncement();
}

// Show Login Interface
function showLogin() {
  loginContainer.classList.remove('hidden');
  appContainer.classList.add('hidden');
}

// Handle Login Form Submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErrorMsg.classList.add('hidden');
  
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && (data.success || data.user)) {
      sessionStorage.setItem('user_session', JSON.stringify({ user: data.user }));
      showApp(data.user);
    } else {
      showLoginError(data.error || "Erro ao conectar ao servidor. Tente novamente.");
    }
  } catch (error) {
    console.error("Erro no login:", error);
    showLoginError("O backend não está rodando. Execute 'npm start' no terminal e tente novamente!");
  }
});

function showLoginError(msg) {
  loginErrorMsg.textContent = msg;
  loginErrorMsg.classList.remove('hidden');
}

// Handle Logout
logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('user_session');
  showLogin();
});

// ================= TAB NAVIGATION SYSTEM =================
function setupTabNavigation() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Toggle button active classes
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Toggle panel visibility
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === tabId) {
          panel.classList.add('active');
        }
      });
      
      // Custom actions per tab change
      if (tabId === 'tab-webhook') {
        fetchWebhookLogs();
      }

      // Community feed: carrega e inicia polling ao entrar na aba
      if (tabId === 'tab-community') {
        loadCommunityFeed();
        if (communityPollingInterval) clearInterval(communityPollingInterval);
        communityPollingInterval = setInterval(loadCommunityFeed, 15000);
      } else {
        // Para o polling ao sair da aba de comunidade
        if (communityPollingInterval) {
          clearInterval(communityPollingInterval);
          communityPollingInterval = null;
        }
      }
    });
  });
  
  // Lesson description details sub-tabs navigation
  detailsTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-details');
      
      detailsTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      detailsTabPanels.forEach(p => {
        p.classList.remove('active');
        if (p.id === panelId) {
          p.classList.add('active');
        }
      });
    });
  });
}

// ================= ACCORDION & LESSON LOADER =================
function renderAccordion() {
  moduleAccordion.innerHTML = '';
  
  // Total count of lessons across all modules
  let totalCount = 0;
  courseData.forEach(module => totalCount += module.lessons.length);
  
  courseData.forEach((module, mIndex) => {
    const moduleGroup = document.createElement('div');
    moduleGroup.className = `module-group ${mIndex === 0 ? 'open' : ''}`;
    
    const header = document.createElement('button');
    header.className = 'module-header';
    header.innerHTML = `
      <div class="module-header-info">
        <h4>Módulo ${mIndex === 0 ? 'Boas-Vindas' : mIndex}</h4>
        <h3>${module.title.replace(/^Módulo \d+: /, '')}</h3>
      </div>
      <svg class="module-icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    
    // Toggle accordion collapse
    header.addEventListener('click', () => {
      moduleGroup.classList.toggle('open');
    });
    
    const lessonsList = document.createElement('div');
    lessonsList.className = 'lessons-list';
    
    module.lessons.forEach(lesson => {
      const lessonId = String(lesson.id);
      const isCompleted = completedLessons.includes(lessonId);
      const isActive = activeLesson && String(activeLesson.id) === lessonId;
      
      const itemBtn = document.createElement('button');
      itemBtn.className = `lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
      itemBtn.innerHTML = `
        <div class="lesson-status-indicator"></div>
        <span class="lesson-title-text" title="${lesson.title}">${lesson.title}</span>
      `;
      
      itemBtn.addEventListener('click', () => {
        // Change Active Tab back to Classes if clicking from elsewhere
        const activeTab = document.querySelector('.nav-tab-btn.active');
        if (activeTab.getAttribute('data-tab') !== 'tab-classes') {
          document.querySelector('[data-tab="tab-classes"]').click();
        }
        
        // Remove active class from previous
        document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
        itemBtn.classList.add('active');
        
        activeLesson = lesson;
        loadLessonData(lesson);
      });
      
      lessonsList.appendChild(itemBtn);
    });
    
    moduleGroup.appendChild(header);
    moduleGroup.appendChild(lessonsList);
    moduleAccordion.appendChild(moduleGroup);
  });
}

function loadLessonData(lesson) {
  if (!lesson) return;
  // Pausa qualquer reprodução ativa do vídeo simulado
  if (videoPlaying) {
    pauseVideo();
  }

  playerLessonTitle.textContent = lesson.title;

  // ====== VIDEO PLAYER: show iframe or hide entirely ======
  const videoContainer = document.querySelector('.video-container');
  const videoBox = document.getElementById('video-box');
  const existingIframe = document.getElementById('lesson-iframe-player');
  if (existingIframe) existingIframe.remove();

  const hasVideo = lesson.iframe_url && lesson.iframe_url.trim() !== '';

  if (hasVideo) {
    let cleanUrl = lesson.iframe_url.trim();
    if (cleanUrl.includes('<iframe') || cleanUrl.includes('src=')) {
      const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) cleanUrl = srcMatch[1];
    }

    // Show video container with iframe
    if (videoContainer) videoContainer.style.display = '';
    videoBox.innerHTML = '';
    videoBox.style.cssText = 'position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; background:#000;';
    const iframe = document.createElement('iframe');
    iframe.id = 'lesson-iframe-player';
    iframe.src = cleanUrl;
    iframe.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; border:none; border-radius:12px;';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    videoBox.appendChild(iframe);
  } else {
    // No video URL — hide the entire player container
    if (videoContainer) videoContainer.style.display = 'none';
    videoBox.style.cssText = '';
    videoBox.innerHTML = '';
  }


  // Lógica de exibição do Quiz de Nivelamento (aula de onboarding)
  const quizCard = document.getElementById('onboarding-quiz-card');
  const detailsCard = document.querySelector('.lesson-details-card:not(#onboarding-quiz-card)');
  const lessonIdStr = String(lesson.id);

  if (lessonIdStr === 'onboarding' || lesson.title.toLowerCase().includes('boas-vindas')) {
    if (quizCard) quizCard.classList.remove('hidden');
    if (detailsCard) detailsCard.classList.add('hidden');
    renderQuizState();
  } else if (lessonIdStr === 'mentoria_chat') {
    if (quizCard) quizCard.classList.add('hidden');
    if (detailsCard) detailsCard.classList.remove('hidden');
    renderMentoriaChatInterface();
  } else {
    if (quizCard) quizCard.classList.add('hidden');
    if (detailsCard) detailsCard.classList.remove('hidden');
    // Restaura as abas comuns
    const summaryTab = document.querySelector('[data-details="lesson-summary"]');
    if (summaryTab) summaryTab.click();
  }

  if (lessonConclusionText) lessonConclusionText.textContent = lesson.conclusion || '';
  if (lessonRationaleText) lessonRationaleText.textContent = lesson.rationale || '';
  
  // Renderiza passos práticos
  if (lessonActionList) {
    lessonActionList.innerHTML = '';
    if (lesson.steps) {
      lesson.steps.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = step;
        lessonActionList.appendChild(li);
      });
    }
  }

  // ====== Lógica de ocultar abas e blocos vazios ======
  const hasConclusion = lesson.conclusion && lesson.conclusion.trim() !== '';
  const hasRationale = lesson.rationale && lesson.rationale.trim() !== '';
  const hasSummary = hasConclusion || hasRationale;
  const hasAction = lesson.steps && lesson.steps.length > 0;
  const hasDownloads = lesson.attachments && lesson.attachments.length > 0;

  const tabSummary = document.querySelector('button[data-details="lesson-summary"]');
  const tabAction = document.querySelector('button[data-details="lesson-action"]');
  const tabDownloads = document.querySelector('button[data-details="lesson-downloads"]');
  
  if (tabSummary) tabSummary.style.display = hasSummary ? '' : 'none';
  if (tabAction) tabAction.style.display = hasAction ? '' : 'none';
  if (tabDownloads) tabDownloads.style.display = hasDownloads ? '' : 'none';

  const conclusionBox = document.querySelector('.executive-box');
  const rationaleBox = document.querySelector('.rationale-box');
  if (conclusionBox) conclusionBox.style.display = hasConclusion ? '' : 'none';
  if (rationaleBox) rationaleBox.style.display = hasRationale ? '' : 'none';

  // Força a ativação da primeira aba visível caso a aba atual fique oculta
  if (detailsCard && !detailsCard.classList.contains('hidden')) {
    const visibleTabs = Array.from(document.querySelectorAll('.details-tab-btn')).filter(btn => btn.style.display !== 'none');
    const currentActiveTab = document.querySelector('.details-tab-btn.active');
    
    if (visibleTabs.length > 0) {
      if (!currentActiveTab || currentActiveTab.style.display === 'none') {
        visibleTabs[0].click();
      }
    } else {
      // Se nenhuma aba tiver conteúdo, esconde o card de detalhes por inteiro para ficar limpo
      detailsCard.classList.add('hidden');
    }
  }

  // Renderiza materiais de apoio (attachments)
  loadLessonAttachments(lesson);

  // Carrega comentários da aula e inicia auto-refresh a cada 10s
  loadLessonComments(lesson.id);
  startCommentsPolling(lesson.id);

  // Atualiza botão de "Marcar como Concluída"
  const lessonIdForCompletion = String(lesson.id);
  const isCompleted = completedLessons.includes(lessonIdForCompletion);
  if (isCompleted) {
    btnMarkComplete.classList.add('active-complete');
    btnMarkComplete.innerHTML = `<span class="checkbox-box"></span> Aula Concluída! ✓`;
  } else {
    btnMarkComplete.classList.remove('active-complete');
    btnMarkComplete.innerHTML = `<span class="checkbox-box"></span> Marcar como Concluída`;
  }
}

// Render dynamic lesson attachments in the Downloads tab
function loadLessonAttachments(lesson) {
  const downloadsPanel = document.getElementById('lesson-downloads');
  if (!downloadsPanel) return;
  const attachments = lesson.attachments || [];
  if (attachments.length === 0) {
    downloadsPanel.innerHTML = '<p style="color:var(--text-creme-muted); text-align:center; padding:1rem;"><i class="fa-solid fa-folder-open" style="margin-right:8px;"></i>Nenhum material de apoio adicionado para esta aula.</p>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'downloads-grid';
  attachments.forEach(att => {
    const isLink = att.type === 'link';
    const icon = isLink ? 'fa-link' : 'fa-file-arrow-down';
    const iconClass = isLink ? 'pdf' : 'pdf';
    const card = document.createElement('div');
    card.className = 'download-item-card';
    card.innerHTML = `
      <div class="icon-wrap ${iconClass}"><i class="fa-solid ${icon}"></i></div>
      <div class="download-info">
        <h5>${att.name || att.originalName || 'Material'}</h5>
        <span>${isLink ? 'Link Externo' : 'Arquivo'}</span>
      </div>
      <a href="${att.url}" target="_blank" rel="noopener" class="btn btn-sm btn-accent"><i class="fa-solid fa-arrow-up-right-from-square" style="margin-right:4px;"></i>${isLink ? 'Abrir' : 'Baixar'}</a>
    `;
    grid.appendChild(card);
  });
  downloadsPanel.innerHTML = '';
  downloadsPanel.appendChild(grid);
}

// Handle Mark Complete Button click
btnMarkComplete.addEventListener('click', () => {
  if (!activeLesson) return;
  const lessonId = String(activeLesson.id);
  const index = completedLessons.indexOf(lessonId);
  
  if (index >= 0) {
    // Undo complete
    completedLessons.splice(index, 1);
    btnMarkComplete.classList.remove('active-complete');
    btnMarkComplete.innerHTML = `<span class="checkbox-box"></span> Marcar como Concluída`;
  } else {
    // Mark complete
    completedLessons.push(lessonId);
    btnMarkComplete.classList.add('active-complete');
    btnMarkComplete.innerHTML = `<span class="checkbox-box"></span> Aula Concluída! ✓`;
  }
  
  localStorage.setItem('dd_completed_lessons', JSON.stringify(completedLessons));
  updateProgressBar();
  renderAccordion();
});

// Update overall Progress Bar
function updateProgressBar() {
  // Limpa IDs de aulas que não existem mais (foram deletadas)
  const validLessonIds = [];
  courseData.forEach(module => {
    (module.lessons || []).forEach(lesson => {
      validLessonIds.push(String(lesson.id));
    });
  });

  // Remove IDs inválidos do completedLessons
  const cleanedCompletedLessons = completedLessons.filter(id => validLessonIds.includes(String(id)));

  // Se houve mudança, atualiza o localStorage
  if (cleanedCompletedLessons.length !== completedLessons.length) {
    completedLessons.length = 0;
    cleanedCompletedLessons.forEach(id => completedLessons.push(id));
    localStorage.setItem('dd_completed_lessons', JSON.stringify(completedLessons));
  }

  // Count total lessons
  const totalLessons = validLessonIds.length;
  const completedCount = completedLessons.length;
  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  progressBarFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  progressCount.textContent = `${completedCount}/${totalLessons}`;

  // Triga checagem de conquistas
  if (typeof checkAchievements === 'function') {
    checkAchievements();
  }
}

// ================= COMMENTS SYSTEM (COMMUNITY) =================

// Load comments for a lesson
async function loadLessonComments(lessonId) {
  if (!commentsListBox) return;

  try {
    const res = await fetch(`/api/lessons/${lessonId}/comments`);
    if (!res.ok) throw new Error('Erro ao carregar comentários');

    const comments = await res.json();
    renderComments(comments);
  } catch (e) {
    console.error('Erro ao carregar comentários:', e);
    commentsListBox.innerHTML = '<p style="color:var(--text-creme-muted); text-align:center; padding:1rem;">Erro ao carregar comentários.</p>';
  }
}

// Render comments list
function renderComments(comments) {
  if (!commentsListBox) return;

  if (comments.length === 0) {
    commentsListBox.innerHTML = '<p style="color:var(--text-creme-muted); text-align:center; padding:1rem;"><i class="fa-solid fa-comments" style="margin-right:8px;"></i>Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
    return;
  }

  const currentUser = JSON.parse(sessionStorage.getItem('user_session'))?.user;
  const isCurrentUserAdmin = currentUser && currentUser.role === 'admin';

  commentsListBox.innerHTML = comments.map(comment => {
    const initials = comment.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const date = new Date(comment.created_at);
    const timeAgo = getTimeAgo(date);
    const isOwnComment = currentUser && comment.user_email === currentUser.email;
    const canDelete = isOwnComment || isCurrentUserAdmin;

    return `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-avatar">${initials}</div>
        <div class="comment-body">
          <div class="comment-meta">
            <strong>${comment.user_name}</strong>
            <span>${timeAgo}</span>
          </div>
          <p>${escapeHtml(comment.comment_text)}</p>
          ${canDelete ? `<button class="btn-delete-comment" onclick="deleteComment(${comment.id})" title="Excluir comentário"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Helper: Calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'Agora mesmo';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d atrás`;

  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Delete comment
async function deleteComment(commentId) {
  if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

  const user = JSON.parse(sessionStorage.getItem('user_session'))?.user;
  if (!user) return;

  try {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: user.email })
    });

    if (!res.ok) throw new Error('Erro ao excluir comentário');

    // Reload comments
    if (activeLesson) {
      loadLessonComments(activeLesson.id);
    }
  } catch (e) {
    console.error('Erro ao excluir comentário:', e);
    alert('Erro ao excluir comentário. Tente novamente.');
  }
}

// Make deleteComment globally accessible for onclick handlers
window.deleteComment = deleteComment;

// ======= POLLING PARA ATUALIZAÇÃO EM TEMPO REAL =======

// Inicia polling de comentários da aula ativa
function startCommentsPolling(lessonId) {
  stopCommentsPolling();
  commentsPollingInterval = setInterval(() => {
    loadLessonComments(lessonId);
  }, 10000); // Atualiza a cada 10 segundos
}

// Para polling de comentários
function stopCommentsPolling() {
  if (commentsPollingInterval) {
    clearInterval(commentsPollingInterval);
    commentsPollingInterval = null;
  }
}

// ================= COMMUNITY FEED (GLOBAL COMMENTS) =================

// Load community feed (all comments from all lessons)
async function loadCommunityFeed() {
  const feedList = document.getElementById('community-feed-list');
  if (!feedList) return;

  try {
    const res = await fetch('/api/comments/all');
    if (!res.ok) throw new Error('Erro ao carregar feed da comunidade');

    const comments = await res.json();
    renderCommunityFeed(comments);
  } catch (e) {
    console.error('Erro ao carregar feed da comunidade:', e);
    feedList.innerHTML = '<p style="color:var(--text-creme-muted); text-align:center; padding:2rem;">Erro ao carregar comentários da comunidade.</p>';
  }
}

// Render community feed
function renderCommunityFeed(comments) {
  const feedList = document.getElementById('community-feed-list');
  if (!feedList) return;

  if (comments.length === 0) {
    feedList.innerHTML = '<p style="color:var(--text-creme-muted); text-align:center; padding:2rem;"><i class="fa-solid fa-comments" style="margin-right:8px;"></i>Nenhum comentário ainda. Seja o primeiro a comentar em uma aula!</p>';
    return;
  }

  const currentUser = JSON.parse(sessionStorage.getItem('user_session'))?.user;
  const isCurrentUserAdmin = currentUser && currentUser.role === 'admin';

  feedList.innerHTML = comments.map(comment => {
    const initials = comment.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const date = new Date(comment.created_at);
    const timeAgo = getTimeAgo(date);
    const isOwnComment = currentUser && comment.user_email === currentUser.email;
    const canDelete = isOwnComment || isCurrentUserAdmin;

    // Find lesson info
    const lessonInfo = findLessonById(comment.lesson_id);
    const lessonTitle = lessonInfo ? lessonInfo.title : `Aula ${comment.lesson_id}`;
    const moduleTitle = lessonInfo ? lessonInfo.moduleTitle : '';

    return `
      <div class="community-feed-item" data-comment-id="${comment.id}">
        <div class="comment-avatar">${initials}</div>
        <div class="community-comment-body">
          <div class="comment-meta">
            <strong>${comment.user_name}</strong>
            <span>${timeAgo}</span>
          </div>
          <div class="community-lesson-tag" onclick="navigateToLesson('${comment.lesson_id}')">
            <i class="fa-solid fa-play-circle" style="margin-right:4px;"></i>
            ${moduleTitle ? `${moduleTitle} → ` : ''}${lessonTitle}
          </div>
          <p>${escapeHtml(comment.comment_text)}</p>
          ${canDelete ? `<button class="btn-delete-comment" onclick="deleteCommunityComment(${comment.id})" title="Excluir comentário"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Helper: Find lesson by ID
function findLessonById(lessonId) {
  for (const module of courseData) {
    const lesson = (module.lessons || []).find(l => String(l.id) === String(lessonId));
    if (lesson) {
      return {
        ...lesson,
        moduleTitle: module.title
      };
    }
  }
  return null;
}

// Navigate to a specific lesson
function navigateToLesson(lessonId) {
  // Switch to classes tab
  document.querySelector('[data-tab="tab-classes"]')?.click();

  // Find and set active lesson
  setTimeout(() => {
    for (const module of courseData) {
      const lesson = (module.lessons || []).find(l => String(l.id) === String(lessonId));
      if (lesson) {
        activeLesson = lesson;
        loadLessonData(lesson);
        renderAccordion();

        // Scroll to lesson in sidebar
        const lessonItems = document.querySelectorAll('.lesson-item');
        lessonItems.forEach(item => {
          if (item.textContent.includes(lesson.title)) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        break;
      }
    }
  }, 100);
}

// Delete comment from community feed
async function deleteCommunityComment(commentId) {
  await deleteComment(commentId);
  // Reload community feed after deletion
  loadCommunityFeed();
}

// Make functions globally accessible
window.navigateToLesson = navigateToLesson;
window.deleteCommunityComment = deleteCommunityComment;

// Handle Lesson Comments Posting
btnPostComment.addEventListener('click', async () => {
  const text = newCommentText.value.trim();
  if (!text) return;

  const user = JSON.parse(sessionStorage.getItem('user_session'))?.user;
  if (!user) {
    alert('Você precisa estar logado para comentar.');
    return;
  }

  if (!activeLesson) return;

  // Disable button while posting
  btnPostComment.disabled = true;
  btnPostComment.textContent = 'Enviando...';

  try {
    const res = await fetch(`/api/lessons/${activeLesson.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: user.email,
        user_name: user.name,
        comment_text: text
      })
    });

    if (!res.ok) throw new Error('Erro ao postar comentário');

    // Clear input and reload comments
    newCommentText.value = '';
    await loadLessonComments(activeLesson.id);
  } catch (e) {
    console.error('Erro ao postar comentário:', e);
    alert('Erro ao postar comentário. Tente novamente.');
  } finally {
    btnPostComment.disabled = false;
    btnPostComment.textContent = 'Enviar';
  }
});

// ================= CUSTOM AUDIO PLAYER (PODCLASSES) =================
function setupAudioPlayers() {
  // Toggle transcripts expanders
  document.querySelectorAll('.btn-show-transcript').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetDiv = document.getElementById(targetId);
      targetDiv.classList.toggle('hidden');
      btn.textContent = targetDiv.classList.contains('hidden') 
        ? "📖 Ver Script / Transcrição" 
        : "📕 Fechar Script";
    });
  });

  // Audio Playback simulation logic
  const customPlayers = document.querySelectorAll('.custom-audio-player');
  
  customPlayers.forEach(player => {
    const audioId = player.getAttribute('data-audio-id');
    const playPauseBtn = player.querySelector('.btn-play-pause');
    const waveformProgress = player.querySelector('.waveform-progress');
    const waveformFill = player.querySelector('.waveform-fill');
    const timeDisplay = player.querySelector('.audio-time');
    const speedButtons = player.querySelectorAll('.btn-speed');
    
    let audioState = activeAudios[audioId];
    
    // Play/Pause Click
    playPauseBtn.addEventListener('click', () => {
      // Pause all other audio players first to prevent overlaying sounds
      Object.keys(activeAudios).forEach(id => {
        if (id !== audioId && activeAudios[id].playing) {
          pauseAudio(id);
        }
      });

      if (audioState.playing) {
        pauseAudio(audioId);
      } else {
        playAudio(audioId);
      }
    });
    
    // Clicking progress bar to scrub/seek
    waveformProgress.addEventListener('click', (e) => {
      const rect = waveformProgress.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      audioState.currentTime = Math.floor(clickPosition * audioState.duration);
      updateAudioDisplay(audioId);
    });

    // Speed click
    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        audioState.speed = parseFloat(btn.getAttribute('data-speed'));
      });
    });
  });
}

function playAudio(audioId) {
  let audioState = activeAudios[audioId];
  const player = document.querySelector(`[data-audio-id="${audioId}"]`);
  const playPauseBtn = player.querySelector('.btn-play-pause');
  
  audioState.playing = true;
  playPauseBtn.textContent = "⏸";
  playPauseBtn.style.backgroundColor = "var(--accent-honey)";
  playPauseBtn.style.color = "var(--bg-deep-cocoa)";

  // Start tick simulation
  audioState.timer = setInterval(() => {
    // Advance progress based on current play speed
    audioState.currentTime += (1 * audioState.speed);
    
    if (audioState.currentTime >= audioState.duration) {
      audioState.currentTime = audioState.duration;
      pauseAudio(audioId);
      audioState.currentTime = 0; // reset
    }
    
    updateAudioDisplay(audioId);
  }, 1000);
}

function pauseAudio(audioId) {
  let audioState = activeAudios[audioId];
  const player = document.querySelector(`[data-audio-id="${audioId}"]`);
  const playPauseBtn = player.querySelector('.btn-play-pause');
  
  audioState.playing = false;
  playPauseBtn.textContent = "▶";
  playPauseBtn.style.backgroundColor = "var(--primary-strawberry)";
  playPauseBtn.style.color = "#fff";
  
  if (audioState.timer) {
    clearInterval(audioState.timer);
    audioState.timer = null;
  }
}

function updateAudioDisplay(audioId) {
  const audioState = activeAudios[audioId];
  const player = document.querySelector(`[data-audio-id="${audioId}"]`);
  const waveformFill = player.querySelector('.waveform-fill');
  const timeDisplay = player.querySelector('.audio-time');
  
  const percentage = (audioState.currentTime / audioState.duration) * 100;
  waveformFill.style.width = `${percentage}%`;
  
  timeDisplay.textContent = `${formatTime(audioState.currentTime)} / ${formatTime(audioState.duration)}`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ================= ABA EXERCÍCIOS: SAVE & INTERACTIONS =================
function setupExercises() {
  // 1. STOP Reflection
  stopReflectionInput.value = stopReflection;
  
  btnSaveStop.addEventListener('click', () => {
    const text = stopReflectionInput.value.trim();
    localStorage.setItem('dd_stop_reflection', text);
    stopReflection = text;
    
    // Toast notification
    stopSavedToast.classList.remove('hidden');
    setTimeout(() => {
      stopSavedToast.classList.add('hidden');
    }, 2000);
  });
  
  // 2. Diário da Saciedade Form submit
  satietyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const food = satietyFoodInput.value.trim();
    const feelingBefore = satietyFeelingBeforeInput.value.trim();
    const feelingAfter = satietyFeelingAfterInput.value.trim();
    
    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      food,
      feelingBefore,
      feelingAfter
    };
    
    satietyLogs.unshift(newLog);
    localStorage.setItem('dd_satiety_logs', JSON.stringify(satietyLogs));
    
    // Reset Form & Rerender
    satietyFoodInput.value = '';
    satietyFeelingBeforeInput.value = '';
    satietyFeelingAfterInput.value = '';
    
    renderSatietyLogs();
    
    // Triga checagem de conquistas
    if (typeof checkAchievements === 'function') {
      checkAchievements();
    }
  });
  
  // Rerender logs initially
  renderSatietyLogs();
  
  // 3. Grocery Checklist Change listeners
  groceryChecklistItems.forEach(item => {
    const index = parseInt(item.getAttribute('data-index'));
    item.checked = groceryChecklist[index];
    
    item.addEventListener('change', () => {
      groceryChecklist[index] = item.checked;
      localStorage.setItem('dd_grocery_checklist', JSON.stringify(groceryChecklist));
      updateChecklistProgress();
    });
  });
  
  updateChecklistProgress();
}

function renderSatietyLogs() {
  satietyLogsList.innerHTML = '';
  
  if (satietyLogs.length === 0) {
    satietyLogsList.innerHTML = '<p class="no-records-msg">Você ainda não adicionou nenhum registro ao seu Diário.</p>';
    return;
  }
  
  satietyLogs.forEach(log => {
    const card = document.createElement('div');
    card.className = 'satiety-log-item';
    card.innerHTML = `
      <button class="btn-delete-log" title="Excluir item">✕</button>
      <span class="log-date">${log.date}</span>
      <div class="log-field">🍔 <strong>Comi:</strong> ${log.food}</div>
      <div class="log-field">🎭 <strong>Sentia antes:</strong> ${log.feelingBefore}</div>
      <div class="log-field">💚 <strong>20 min depois:</strong> ${log.feelingAfter}</div>
    `;
    
    // Delete log item handler
    card.querySelector('.btn-delete-log').addEventListener('click', () => {
      satietyLogs = satietyLogs.filter(l => l.id !== log.id);
      localStorage.setItem('dd_satiety_logs', JSON.stringify(satietyLogs));
      renderSatietyLogs();
    });
    
    satietyLogsList.appendChild(card);
  });
}

function updateChecklistProgress() {
  const total = groceryChecklist.length;
  const checkedCount = groceryChecklist.filter(Boolean).length;
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  
  checklistPercent.textContent = `${percent}%`;
  checklistBarFill.style.width = `${percent}%`;

  // Triga checagem de conquistas
  if (typeof checkAchievements === 'function') {
    checkAchievements();
  }
}

// ================= DEVELOPER WEBHOOK SIMULATOR & LOGGING =================
function setupWebhookLogs() {
  // Clear Logs
  btnClearWebhookLogs.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/webhook-logs/clear', { method: 'POST' });
      if (response.ok) {
        webhookLogsConsole.innerHTML = '<div class="log-empty">Logs de webhook limpos com sucesso.</div>';
      }
    } catch (e) {
      console.error("Falha ao limpar logs de webhook:", e);
    }
  });
}

// Fetch logs from Node server and update debugger console
async function fetchWebhookLogs() {
  try {
    const response = await fetch('/api/webhook-logs');
    if (!response.ok) return;
    
    const logs = await response.json();
    
    if (logs.length === 0) {
      webhookLogsConsole.innerHTML = '<div class="log-empty">Nenhum webhook recebido recentemente. Envie uma simulação ao lado.</div>';
      return;
    }
    
    webhookLogsConsole.innerHTML = '';
    
    logs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleTimeString();
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `
        <div>[<span class="log-time">${dateStr}</span>] - <strong>POST /api/webhook/hotmart</strong></div>
        <div class="log-body">${JSON.stringify(log.body, null, 2)}</div>
      `;
      webhookLogsConsole.appendChild(div);
    });
  } catch (error) {
    console.error("Falha ao ler logs de webhook do backend:", error);
    webhookLogsConsole.innerHTML = '<div class="log-empty" style="color:red">Backend indisponível para ler logs.</div>';
  }
}

// Submit simulated Hotmart webhook
webhookSimulatorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = simName.value.trim();
  const email = simEmail.value.trim();
  const status = simStatus.value;
  const platform = simPlatform.value;
  
  let payload = {};
  
  // Format payload according to the simulated platform setting
  if (platform === 'hotmart') {
    payload = {
      event: "purchase_approved",
      status: status,
      name: name,
      email: email,
      purchase_date: new Date().toISOString(),
      transaction: "HP" + Math.floor(Math.random() * 10000000)
    };
  } else if (platform === 'hotmart_v2') {
    payload = {
      event: status === 'approved' ? 'purchase_approved' : 'purchase_refunded',
      data: {
        buyer: {
          name: name,
          email: email
        },
        purchase: {
          status: status,
          transaction: "HP" + Math.floor(Math.random() * 10000000),
          price: { value: 197.00, currency: "BRL" }
        }
      }
    };
  } else {
    // Kiwify / Flat params style
    payload = {
      status: status === 'approved' ? 'paid' : status,
      buyer_name: name,
      buyer_email: email,
      product_name: "Dieta do Doce VIP",
      order_id: "KW" + Math.floor(Math.random() * 10000000)
    };
  }
  
  try {
    // Post to the webhook route on our backend
    const response = await fetch('/api/webhook/hotmart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Simulated-By': 'Front-End Debugger Panel'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert(`Webhook processado com sucesso pelo backend!\n\nExtrato: E-mail: ${email} | Nome: ${name}\nStatus: ${status}\n\nVocê já pode usar este e-mail para logar no portal com a senha "doce123"!`);
      fetchWebhookLogs();
    } else {
      alert("Falha no processamento: " + (result.message || "Erro desconhecido"));
    }
  } catch (error) {
    console.error("Erro ao simular webhook:", error);
    alert("Falha ao comunicar com o servidor. Execute o backend Node.js primeiro!");
  }
});

/* =========================================================================
   SISTEMA LXD ULTRA-PREMIUM (ARQUITETO DE MEMBROS & DESIGNER DE EXPERIÊNCIA)
   ========================================================================= */

// 1. Inicialização do Motor LXD Premium
function setupPremiumLXDEngine() {
  // Lógica do Quiz de Nivelamento (Clique em opções)
  document.querySelectorAll('.quiz-opt-card').forEach(card => {
    card.addEventListener('click', () => {
      const parentStepBox = card.closest('.quiz-step-box');
      const stepId = parentStepBox.id;
      
      // Seleciona opção visualmente
      parentStepBox.querySelectorAll('.quiz-opt-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      const val = card.getAttribute('data-val');
      parentStepBox.setAttribute('data-selected-value', val);
      
      // Avança de passo com delay suave
      setTimeout(() => {
        if (stepId === 'quiz-step-1') {
          transitionQuizSteps('quiz-step-1', 'quiz-step-2');
        } else if (stepId === 'quiz-step-2') {
          transitionQuizSteps('quiz-step-2', 'quiz-step-3');
        } else if (stepId === 'quiz-step-3') {
          calculateStudentProfile();
        }
      }, 350);
    });
  });

  // Clique em concluir nivelamento
  const btnQuizFinish = document.getElementById('btn-quiz-finish');
  if (btnQuizFinish) {
    btnQuizFinish.addEventListener('click', () => {
      const profileName = document.getElementById('quiz-profile-name').textContent;
      const profileDesc = document.getElementById('quiz-profile-desc').textContent;
      
      localStorage.setItem('dd_student_profile', JSON.stringify({ name: profileName, desc: profileDesc }));
      
      // Atualiza interface do cabeçalho
      const session = JSON.parse(sessionStorage.getItem('user_session'));
      if (session) {
        showApp(session.user);
      }
      
      // Marcar onboarding como concluído e checar medalhas
      if (!completedLessons.includes('onboarding')) {
        completedLessons.push('onboarding');
        localStorage.setItem('dd_completed_lessons', JSON.stringify(completedLessons));
        updateProgressBar();
        renderAccordion();
      }
      
      // Abre aba de conquistas com confetes comemorativos
      triggerConfetti();
      document.querySelector('[data-tab="tab-achievements"]').click();
      alert("Parabéns! O seu onboarding foi concluído e o seu perfil metabólico doce foi configurado com sucesso! 🏆");
    });
  }

  // Lógica do Player de Vídeo Interativo
  const playCoverBtn = document.getElementById('video-content-mock');
  if (playCoverBtn) {
    playCoverBtn.addEventListener('click', () => {
      // Inicia reprodução simulada
      startVideo();
    });
  }

  const btnVideoPlayPause = document.getElementById('btn-video-play-pause');
  if (btnVideoPlayPause) {
    btnVideoPlayPause.addEventListener('click', () => {
      if (videoPlaying) {
        pauseVideo();
      } else {
        startVideo();
      }
    });
  }

  // Velocidades do vídeo
  document.querySelectorAll('.btn-vspeed').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-vspeed').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      videoSpeed = parseFloat(btn.getAttribute('data-vspeed'));
    });
  });

  // Modal de Checkout de Upsell (Abrir / Fechar)
  const btnTriggerUpsell = document.getElementById('btn-trigger-upsell');
  if (btnTriggerUpsell) {
    btnTriggerUpsell.addEventListener('click', () => {
      document.getElementById('checkout-modal').classList.remove('hidden');
      resetCheckoutState();
    });
  }

  const btnCloseCheckout = document.getElementById('btn-close-checkout');
  if (btnCloseCheckout) {
    btnCloseCheckout.addEventListener('click', () => {
      document.getElementById('checkout-modal').classList.add('hidden');
    });
  }

  // Métodos de pagamento do checkout
  const btnPayPix = document.getElementById('btn-pay-pix');
  const btnPayCard = document.getElementById('btn-pay-card');
  if (btnPayPix && btnPayCard) {
    btnPayPix.addEventListener('click', () => {
      btnPayPix.classList.add('active');
      btnPayCard.classList.remove('active');
      document.getElementById('checkout-pix-section').classList.add('active');
      document.getElementById('checkout-card-section').classList.remove('active');
      startPixCountdown();
    });
    
    btnPayCard.addEventListener('click', () => {
      btnPayCard.classList.add('active');
      btnPayPix.classList.remove('active');
      document.getElementById('checkout-card-section').classList.add('active');
      document.getElementById('checkout-pix-section').classList.remove('active');
    });
  }

  // Chave Pix Copiar
  const btnCopyPix = document.getElementById('btn-copy-pix');
  if (btnCopyPix) {
    btnCopyPix.addEventListener('click', () => {
      alert("Chave Copia e Cola Pix copiada! Efetue o pagamento simulado para aprovação em tempo real.");
    });
  }

  // Formulário de Cartão de Crédito Simulado
  const fakeCheckoutForm = document.getElementById('fake-checkout-form');
  if (fakeCheckoutForm) {
    fakeCheckoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = fakeCheckoutForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Processando transação com segurança...";
      
      setTimeout(() => {
        approveUpsellPurchase();
        submitBtn.disabled = false;
        submitBtn.textContent = "Aprovar Compra e Desbloquear Mentoria 🚀";
      }, 1800);
    });
  }

  // Fechamento do Certificado
  document.getElementById('btn-close-certificate').addEventListener('click', () => {
    document.getElementById('certificate-modal').classList.add('hidden');
  });
  document.getElementById('btn-close-cert-btn').addEventListener('click', () => {
    document.getElementById('certificate-modal').classList.add('hidden');
  });

  // Botão abrir Certificado na aba de conquistas
  const btnOpenCert = document.getElementById('btn-open-certificate');
  if (btnOpenCert) {
    btnOpenCert.addEventListener('click', () => {
      openCertificateModal();
    });
  }

  // Imprimir Certificado
  document.getElementById('btn-print-cert').addEventListener('click', () => {
    window.print();
  });

  // Atualização dinâmica do nome do Certificado
  const certInputName = document.getElementById('cert-input-name');
  if (certInputName) {
    certInputName.addEventListener('input', () => {
      document.getElementById('cert-student-name').textContent = certInputName.value.toUpperCase();
    });
  }

  // Roda primeira verificação de conquistas
  checkAchievements();

  // Escutas e carregamentos dedicados do Painel de Administrador
  if (typeof extendAdminDashboardListeners === 'function') {
    extendAdminDashboardListeners();
  }
  const session = JSON.parse(sessionStorage.getItem('user_session'));
  if (session && session.user && session.user.role === 'admin') {
    if (typeof loadAdminUsersTable === 'function') {
      loadAdminUsersTable();
    }
    // Show course management section and render it
    const courseSection = document.getElementById('admin-course-section');
    if (courseSection) courseSection.style.display = 'block';
    renderAdminCourseManager();

    // Show bonus management section and render it
    const bonusSection = document.getElementById('admin-bonus-section');
    if (bonusSection) bonusSection.style.display = 'block';
    renderAdminBonusManager();
  }
}

// 2. Transições e Lógica do Quiz de Boas-Vindas
function transitionQuizSteps(fromId, toId) {
  const fromEl = document.getElementById(fromId);
  const toEl = document.getElementById(toId);
  
  fromEl.style.opacity = 0;
  setTimeout(() => {
    fromEl.classList.add('hidden');
    fromEl.classList.remove('active');
    
    toEl.classList.remove('hidden');
    toEl.classList.add('active');
    toEl.style.opacity = 0;
    setTimeout(() => {
      toEl.style.opacity = 1;
    }, 50);
  }, 300);
}

// Calcula o Perfil Metabólico Doce
function calculateStudentProfile() {
  const q1 = document.getElementById('quiz-step-1').getAttribute('data-selected-value');
  const q2 = document.getElementById('quiz-step-2').getAttribute('data-selected-value');
  const q3 = document.getElementById('quiz-step-3').getAttribute('data-selected-value');
  
  let profileTitle = "";
  let profileDescription = "";
  
  if (q1 === 'culpa') {
    profileTitle = "Combatente da Culpa 🛡️";
    profileDescription = "Você luta constantemente contra a sensação de fracasso ao comer doces. O protocolo vai te ensinar que a restrição gera compulsão, e o segredo é o acolhimento nutricional.";
  } else if (q1 === 'ansiedade') {
    profileTitle = "Desbravadora Noturna 🌙";
    profileDescription = "A sua maior fraqueza é a vontade incontrolável que bate às 22h por puro estresse diário. Seu plano de ação foca no Bolinho de Caneca Fit de 2 minutos e chás de camomila/mulungu.";
  } else {
    profileTitle = "Guardiã da TPM ⚡";
    profileDescription = "Os hormônios comandam a sua fome emocional na TPM. Você precisa de magnésio e triptofano! Seu melhor aliado é o Brigadeiro de Colher Fit rico em Cacau 100%.";
  }
  
  // Refinamento do doce favorito
  if (q2 === 'chocolate') {
    profileTitle = "Formiga Chocolateira VIP 🍫";
  } else if (q2 === 'bolo') {
    profileTitle = "Confeiteira Consciente 🍰";
  } else {
    profileTitle = "Exploradora de Sabores 🍬";
  }
  
  // Ajuste do tempo de cozinha
  if (q3 === 'sem_tempo') {
    profileDescription += " Focaremos estritamente nas receitas de copo/caneca de 2 minutos para otimizar seu dia!";
  } else {
    profileDescription += " Prepare-se para testar tortas e cookies fits maravilhosos para congelar e saborear a semana toda!";
  }

  // Renderiza resultado
  document.getElementById('quiz-step-3').classList.add('hidden');
  document.getElementById('quiz-step-3').classList.remove('active');
  
  const resultBox = document.getElementById('quiz-result-box');
  resultBox.classList.remove('hidden');
  document.getElementById('quiz-profile-name').textContent = profileTitle;
  document.getElementById('quiz-profile-desc').textContent = profileDescription;
}

// Renderiza o Estado Atual do Quiz
function renderQuizState() {
  const profile = JSON.parse(localStorage.getItem('dd_student_profile'));
  const steps = ['quiz-step-1', 'quiz-step-2', 'quiz-step-3', 'quiz-result-box'];
  
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  
  if (profile) {
    const resultBox = document.getElementById('quiz-result-box');
    resultBox.classList.remove('hidden');
    document.getElementById('quiz-profile-name').textContent = profile.name;
    document.getElementById('quiz-profile-desc').textContent = profile.desc;
    
    // Altera texto do botão final
    const btn = document.getElementById('btn-quiz-finish');
    btn.textContent = "Refazer Quiz de Nivelamento 🔄";
    btn.onclick = () => {
      localStorage.removeItem('dd_student_profile');
      renderQuizState();
    };
  } else {
    const step1 = document.getElementById('quiz-step-1');
    step1.classList.remove('hidden');
    step1.classList.add('active');
    step1.style.opacity = 1;
    step1.querySelectorAll('.quiz-opt-card').forEach(c => c.classList.remove('selected'));
    
    const btn = document.getElementById('btn-quiz-finish');
    btn.textContent = "Aplicar Personalização e Concluir Onboarding 🚀";
    btn.onclick = null; // restaura padrão
  }
}

// 3. Player de Vídeo Interativo Simulado
function startVideo() {
  videoPlaying = true;
  
  // Oculta capa e exibe tela ativa e controles
  document.getElementById('video-content-mock').classList.add('hidden');
  document.getElementById('video-player-interface').classList.remove('hidden');
  document.getElementById('video-controls-overlay').classList.remove('hidden');
  
  const playBtn = document.getElementById('btn-video-play-pause');
  playBtn.textContent = "⏸";
  
  // Inicia timer
  if (videoTimer) clearInterval(videoTimer);
  videoTimer = setInterval(() => {
    videoCurrentTime += (1 * videoSpeed);
    
    if (videoCurrentTime >= videoDuration) {
      videoCurrentTime = videoDuration;
      pauseVideo();
      videoCurrentTime = 0; // reset
      finishVideoLesson();
    }
    
    updateVideoDisplay();
  }, 1000);
  
  // Ativa a animação de ondas de áudio do vídeo
  document.getElementById('video-wave').classList.add('playing');
}

function pauseVideo() {
  videoPlaying = false;
  const playBtn = document.getElementById('btn-video-play-pause');
  if (playBtn) playBtn.textContent = "▶";
  
  if (videoTimer) {
    clearInterval(videoTimer);
    videoTimer = null;
  }
  
  const wave = document.getElementById('video-wave');
  if (wave) wave.classList.remove('playing');
}

function updateVideoDisplay() {
  const scrubFill = document.getElementById('video-scrub-fill');
  const timeDisplay = document.getElementById('video-time-display');
  const subtitleEl = document.getElementById('video-subtitles');
  
  if (!scrubFill || !timeDisplay) return;

  const percentage = (videoCurrentTime / videoDuration) * 100;
  scrubFill.style.width = `${percentage}%`;
  
  timeDisplay.textContent = `${formatTime(videoCurrentTime)} / ${formatTime(videoDuration)}`;

  // Atualização das Legendas sincronizadas
  const subtitles = videoSubtitlesData[activeLesson.id] || [
    { time: 0, text: `Assistindo à aula: ${activeLesson.title} 👩‍⚕️` },
    { time: 5, text: "Coloque em prática estas orientações estratégicas hoje mesmo!" },
    { time: 12, text: "O seu emagrecimento consciente começa nas pequenas escolhas diárias." }
  ];
  
  let activeText = subtitles[0].text;
  for (let i = 0; i < subtitles.length; i++) {
    if (videoCurrentTime >= subtitles[i].time) {
      activeText = subtitles[i].text;
    }
  }
  subtitleEl.textContent = activeText;
}

// Conclusão automática de aula ao fim do vídeo
function finishVideoLesson() {
  if (!completedLessons.includes(activeLesson.id)) {
    completedLessons.push(activeLesson.id);
    localStorage.setItem('dd_completed_lessons', JSON.stringify(completedLessons));
    updateProgressBar();
    renderAccordion();
    loadLessonData(activeLesson);
    
    triggerConfetti();
    alert(`Parabéns! Você assistiu à aula completa e acumulou mais progresso! ✓ 🏆`);
  }
}

// 4. Motor de Gamificação (Medalhas, Conquistas & Bônus)
function checkAchievements() {
  // Conquista 1: Onboarding
  const onboardingFinished = completedLessons.includes('onboarding');
  updateAchievementCard('ach-onboarding', onboardingFinished, "Primeiros Passos");

  // Conquista 2: Checklist (Minimo 6 ingredientes marcados)
  const checkedIngCount = groceryChecklist.filter(Boolean).length;
  const checklistFinished = checkedIngCount >= 6;
  updateAchievementCard('ach-checklist', checklistFinished, "Despensa Blindada", `${checkedIngCount}/12 ingredientes`);

  // Conquista 3: Diário (Minimo 1 diário criado)
  const diaryCount = satietyLogs.length;
  const diaryFinished = diaryCount >= 1;
  updateAchievementCard('ach-diary', diaryFinished, "Diário Iniciado");

  // Conquista 4: Meio do caminho (50% de conclusão de aulas)
  let totalLessonsCount = 0;
  courseData.forEach(m => totalLessonsCount += m.lessons.length);
  const compCount = completedLessons.length;
  const halfFinished = compCount >= (totalLessonsCount / 2) && totalLessonsCount > 0;
  updateAchievementCard('ach-half', halfFinished, "Meio do Caminho", `${compCount}/${totalLessonsCount} aulas`);

  // Conquista 5: Mestre Dieta do Doce (100% de conclusão)
  const masterFinished = compCount >= totalLessonsCount && totalLessonsCount > 0;
  updateAchievementCard('ach-master', masterFinished, "Mestre Dieta do Doce");

  // Constrói o estado base das conquistas locais
  const achievementState = {
    'ach-first-step': onboardingFinished,
    'ach-diary': diaryFinished,
    'ach-master': masterFinished
  };

  // Injeta as conquistas salvas no perfil do usuário (ex: Order Bump, Upsells)
  const session = JSON.parse(sessionStorage.getItem('user_session'));
  const userAchievements = (session && session.user && session.user.achievements) || [];
  userAchievements.forEach(ach => {
    achievementState[ach] = true;
  });

  // Agora renderiza dinamicamente os bônus baseando-se no estado das conquistas
  renderUserBonuses(achievementState);
}

function updateAchievementCard(cardId, isUnlocked, titleText, labelSubtitle = "") {
  const card = document.getElementById(cardId);
  if (!card) return;
  
  const statusLabel = card.querySelector('.ach-status-label');
  
  if (isUnlocked) {
    card.classList.remove('locked');
    card.classList.add('unlocked');
    statusLabel.textContent = "Concluído ✓";
  } else {
    card.classList.add('locked');
    card.classList.remove('unlocked');
    statusLabel.textContent = labelSubtitle || "Trancado";
  }
}

function renderUserBonuses(achievementState) {
  const grid = document.querySelector('.bonus-grid');
  if (!grid) return;
  
  if (bonusData.length === 0) {
    grid.innerHTML = '<div style="text-align:center; padding:2rem; width:100%; color:var(--text-creme-muted);">Nenhum bônus disponível no momento.</div>';
    return;
  }

  const sessionStr = sessionStorage.getItem('user_session');
  let daysSinceCreation = 0; // Default if not logged in or missing date
  if (sessionStr) {
    const session = JSON.parse(sessionStr);
    if (session && session.user && session.user.createdAt) {
      const createdAt = new Date(session.user.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - createdAt);
      daysSinceCreation = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  grid.innerHTML = '';
  bonusData.forEach(bonus => {
    // 1. Verifica se a conquista necessária foi desbloqueada (se houver uma selecionada)
    const achIsUnlocked = !bonus.unlock_achievement_id || bonus.unlock_achievement_id === 'Nenhuma' || achievementState[bonus.unlock_achievement_id] === true;
    
    // 2. Verifica liberação por tempo
    const releaseDays = bonus.release_days || 0;
    const timeIsUnlocked = daysSinceCreation >= releaseDays;
    
    // O bônus só desbloqueia se AMBAS as condições forem atendidas
    const isUnlocked = achIsUnlocked && timeIsUnlocked;
    
    let badgeHtml = '';
    let btnHtml = '';

    if (isUnlocked) {
      badgeHtml = '<i class="fa-solid fa-lock-open" style="margin-right: 4px;"></i>Desbloqueado';
      // Tratamento para certificados (se file_url == 'certificate')
      if (bonus.file_url === 'certificate') {
        btnHtml = `<button class="btn btn-sm btn-accent btn-block btn-bonus-download" id="btn-open-certificate">${bonus.action_text || 'Ver Certificado'}</button>`;
      } else {
        btnHtml = `<a ${bonus.file_url ? 'href="' + bonus.file_url + '" target="_blank"' : ''} class="btn btn-sm btn-accent btn-block btn-bonus-download">${bonus.action_text || 'Acessar'}</a >`;
      }
    } else {
      if (!timeIsUnlocked) {
        const daysLeft = releaseDays - daysSinceCreation;
        badgeHtml = `<i class="fa-solid fa-clock" style="margin-right: 4px;"></i>Disponível em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`;
        btnHtml = `<button class="btn btn-primary" style="width:100%; border-radius:0;" disabled>Disponível em breve</button>`;
      } else {
        badgeHtml = '<i class="fa-solid fa-lock" style="margin-right: 4px;"></i>Bloqueado';
        if (bonus.unlock_achievement_id && bonus.unlock_achievement_id.startsWith('order_bump_') && bonus.checkout_url) {
          btnHtml = `<a href="${bonus.checkout_url}" target="_blank" class="btn btn-sm btn-accent btn-block btn-bonus-download" style="text-align:center;"><i class="fa-solid fa-cart-shopping" style="margin-right: 6px;"></i>Comprar Agora</a>`;
        } else {
          btnHtml = `<button class="btn btn-sm btn-outline btn-block" style="cursor:not-allowed;" disabled>${bonus.action_text || 'Bloqueado'}</button>`;
        }
      }
    }

    const cardClass = isUnlocked ? 'bonus-card unlocked' : 'bonus-card locked';
    


    const card = document.createElement('div');
    card.className = cardClass;
    card.id = `bonus-dyn-${bonus.id}`;
    card.innerHTML = `
      <div class="bonus-card-glow"></div>
      <span class="bonus-badge">${badgeHtml}</span>
      <div class="bonus-icon"><i class="fa-solid ${bonus.icon || 'fa-gift'}" style="color: var(--accent-honey);"></i></div>
      <h3>${bonus.title}</h3>
      <p>${bonus.description}</p>
      <div class="bonus-unlock-hint">Destrava com: <strong>${bonus.unlock_hint}</strong></div>
      ${btnHtml}
    `;
    grid.appendChild(card);
  });
  
  // Re-anexar evento do botão do certificado
  const btnCert = document.getElementById('btn-open-certificate');
  if (btnCert) {
    btnCert.addEventListener('click', () => {
      document.getElementById('certificate-modal').classList.remove('hidden');
    });
  }
}

// 5. Upgrade de Mentoria, Checkout de Upsell & Injeção de Módulo 5
function resetCheckoutState() {
  document.getElementById('checkout-pix-section').classList.add('active');
  document.getElementById('checkout-card-section').classList.remove('active');
  document.getElementById('btn-pay-pix').classList.add('active');
  document.getElementById('btn-pay-card').classList.remove('active');
  
  startPixCountdown();
}

let pixTimer = null;
function startPixCountdown() {
  const countdownEl = document.getElementById('checkout-countdown');
  let timeLeft = 4;
  countdownEl.textContent = `${timeLeft}s`;
  
  if (pixTimer) clearInterval(pixTimer);
  pixTimer = setInterval(() => {
    timeLeft--;
    countdownEl.textContent = `${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(pixTimer);
      pixTimer = null;
      approveUpsellPurchase();
    }
  }, 1000);
}

function approveUpsellPurchase() {
  if (pixTimer) clearInterval(pixTimer);
  
  hasPurchasedMentoria = true;
  localStorage.setItem('dd_purchased_mentoria', 'true');
  
  // Oculta modal de checkout
  document.getElementById('checkout-modal').classList.add('hidden');
  
  // Injeta Módulo 5 e atualiza interface
  injectMentoriaModule();
  renderAccordion();
  
  // Efeito comemorativo de confete
  triggerConfetti();
  
  alert("🎉 Parabéns! Sua compra simulada da Mentoria VIP foi aprovada!\n\nO 'Módulo 5: Suporte Especializado & Mentoria' foi desbloqueado com sucesso na sua barra lateral. Acesse-o para falar direto com a nutricionista!");
  
  // Rola sidebar direto para o Módulo 5
  setTimeout(() => {
    const modules = document.querySelectorAll('.module-group');
    const m5 = modules[modules.length - 1];
    if (m5) {
      m5.classList.add('open');
      const itemBtn = m5.querySelector('.lesson-item');
      if (itemBtn) itemBtn.click();
    }
  }, 200);
}

function injectMentoriaModule() {
  // Verifica se o módulo já está injetado
  if (courseData.find(m => m.id === 5)) return;
  
  courseData.push({
    id: 5,
    title: "👑 Módulo 5: Suporte Especializado & Mentoria",
    lessons: [
      {
        id: "mentoria_chat",
        title: "💬 Chat Exclusivo com sua Nutri VIP",
        duration: "5 min",
        conclusion: "Acompanhamento direto e esclarecimento de dúvidas em tempo real para blindar o seu metabolismo.",
        rationale: "Ter um canal seguro para discutir desvios de rotina ou ajustes de cardápio previne a estafa mental e garante resultados definitivos na esteira premium.",
        steps: [
          "Digite suas dúvidas sobre ingredientes, receitas ou timining metabólico.",
          "Aguarde o feedback individualizado da Dra. Marina.",
          "Coloque as respostas em prática e registre sua evolução no Diário."
        ]
      }
    ]
  });
}

// 6. Interface de Chat com a Nutricionista no Módulo 5
function renderMentoriaChatInterface() {
  const detailsContentBox = document.querySelector('.details-content-box');
  
  detailsContentBox.innerHTML = `
    <div class="mentor-chat-card">
      <div class="chat-messages-container" id="chat-messages-container">
        <div class="chat-bubble nutri">
          <span class="chat-sender-info">Dra. Marina (Nutri Dieta do Doce) • Agora mesmo</span>
          Olá, querida! Seja muito bem-vinda ao seu espaço de mentoria individual. 
          Estou aqui para tirar qualquer dúvida que você tenha sobre substituições inteligentes, timing metabólico ou como acalmar a TPM. O que você gostaria de me perguntar hoje?
        </div>
      </div>
      
      <div class="chat-input-area">
        <input type="text" id="chat-student-input" placeholder="Pergunte sobre receitas fit, pós-treino ou substitutos...">
        <button class="btn btn-accent" id="btn-chat-send">Enviar</button>
      </div>
    </div>
  `;

  // Listener para envio de chat
  const sendBtn = document.getElementById('btn-chat-send');
  const inputEl = document.getElementById('chat-student-input');
  
  if (sendBtn && inputEl) {
    sendBtn.addEventListener('click', sendMessageToNutri);
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessageToNutri();
    });
  }
}

function sendMessageToNutri() {
  const inputEl = document.getElementById('chat-student-input');
  const container = document.getElementById('chat-messages-container');
  const text = inputEl.value.trim();
  
  if (!text) return;
  
  // Mensagem do estudante
  const stMsg = document.createElement('div');
  stMsg.className = "chat-bubble student";
  stMsg.innerHTML = `
    <span class="chat-sender-info">Você • Agora mesmo</span>
    ${text}
  `;
  container.appendChild(stMsg);
  inputEl.value = "";
  
  container.scrollTop = container.scrollHeight;
  
  // Balão de digitação temporário da Nutri
  const typingMsg = document.createElement('div');
  typingMsg.className = "chat-bubble nutri";
  typingMsg.id = "nutri-typing-bubble";
  typingMsg.innerHTML = `<span class="chat-sender-info">Dra. Marina</span><em>Dra. Marina está digitando uma resposta...</em>`;
  
  setTimeout(() => {
    container.appendChild(typingMsg);
    container.scrollTop = container.scrollHeight;
    
    // Resposta nutricional simulada inteligente
    setTimeout(() => {
      typingMsg.remove();
      
      let nutriReply = "";
      const lower = text.toLowerCase();
      
      if (lower.includes('doce') || lower.includes('receita') || lower.includes('brigadeiro')) {
        nutriReply = "Adoro essa pergunta! Quando bater a vontade de doces, lembre-se do deficit calórico e use receitas fits de cacau 100%. O magnésio presente no cacau é um relaxante natural e vai saciar seu cérebro sem picos de insulina!";
      } else if (lower.includes('treino') || lower.includes('pós-treino') || lower.includes('exercício')) {
        nutriReply = "Momento excelente! No pós-treino, a barreira celular GLUT4 está aberta no músculo. O consumo do doce fit nessa janela direciona a energia direto para repor glicogênio muscular, não acumulando como gordura na barriga. Pode aproveitar!";
      } else if (lower.includes('tpm') || lower.includes('menstrua') || lower.includes('cólica')) {
        nutriReply = "Entendo muito bem, amiga. Na TPM o estrogênio cai e a serotonina despenca, gerando desejo por carboidratos. Recomendo nosso Brigadeiro de Colher Fit morno. Ele acolhe e sacia perfeitamente!";
      } else {
        nutriReply = "Excelente reflexão! Para obtermos o melhor resultado, recomendo manter a regra 80/20: consuma iogurte grego com frutas e canela nos dias de rotina, e reserve o doce convencional para o Mini-Prazer Planejado com as amigas. Faz sentido pra você?";
      }
      
      const resMsg = document.createElement('div');
      resMsg.className = "chat-bubble nutri";
      resMsg.innerHTML = `
        <span class="chat-sender-info">Dra. Marina (Nutri Dieta do Doce) • Agora mesmo</span>
        ${nutriReply}
      `;
      container.appendChild(resMsg);
      container.scrollTop = container.scrollHeight;
    }, 1500);
  }, 800);
}

// 7. Abertura do Certificado de Conclusão VIP
function openCertificateModal() {
  const session = JSON.parse(sessionStorage.getItem('user_session')) || { user: { name: "Aluna VIP" } };
  
  const certModal = document.getElementById('certificate-modal');
  const certStudentName = document.getElementById('cert-student-name');
  const certInputName = document.getElementById('cert-input-name');
  
  if (certModal) {
    certModal.classList.remove('hidden');
    certStudentName.textContent = session.user.name.toUpperCase();
    certInputName.value = session.user.name;
    triggerConfetti();
  }
}

// 8. Efeito de Confetes (Pure Vanilla CSS/JS)
function triggerConfetti() {
  const colors = ['#ff3378', '#ffcc00', '#ff66b2', '#00ffcc', '#fff'];
  for (let i = 0; i < 60; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = `${Math.random() * 8 + 5}px`;
    confetti.style.height = `${Math.random() * 15 + 8}px`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.top = '-20px';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.zIndex = '9999';
    confetti.style.opacity = Math.random();
    confetti.style.borderRadius = '2px';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    document.body.appendChild(confetti);
    
    // Animação de queda
    const duration = Math.random() * 3 + 2; // 2s a 5s
    confetti.style.transition = `transform ${duration}s linear, top ${duration}s linear, opacity ${duration}s ease-out`;
    
    setTimeout(() => {
      confetti.style.top = '105vh';
      confetti.style.transform = `rotate(${Math.random() * 1000 + 360}deg) translateX(${Math.random() * 100 - 50}px)`;
      confetti.style.opacity = '0';
    }, 100);
    
    setTimeout(() => {
      confetti.remove();
    }, duration * 1000 + 200);
  }
}

// =========================================================================
// LÓGICA DE GERENCIAMENTO DO ADMINISTRADOR (LADO CLIENTE)
// =========================================================================

// Variáveis locais para armazenar configurações do admin
let currentAdminConfig = {
  blockedElements: [],
  adminAnnouncement: ""
};

// Carrega as configurações de bloqueio e comunicado
async function loadAdminLocksAndAnnouncement() {
  try {
    const res = await fetch('/api/admin/config');
    if (!res.ok) return;
    
    currentAdminConfig = await res.json();
    
    // 1. Aplica o Banner de Avisos Globais
    const bannerEl = document.getElementById('global-announcement-banner');
    const bannerText = document.getElementById('banner-text');
    
    if (currentAdminConfig.adminAnnouncement && currentAdminConfig.adminAnnouncement.trim() !== "") {
      bannerText.textContent = currentAdminConfig.adminAnnouncement;
      bannerEl.classList.remove('hidden');
    } else {
      bannerEl.classList.add('hidden');
    }
    
    // 2. Oculta ou exibe os elementos de acordo com os bloqueios
    const blocks = currentAdminConfig.blockedElements || [];
    const session = JSON.parse(sessionStorage.getItem('user_session'));
    const isAdmin = session && session.user && session.user.role === 'admin';

    // Mapeamento: id do bloqueio -> { seletor da seção, data-tab do botão sidebar }
    const blockMap = [
      { id: 'tab-podclasses',  section: '#tab-podclasses',  sidebarTab: 'tab-podclasses'  },
      { id: 'tab-exercises',   section: '#tab-exercises',   sidebarTab: 'tab-exercises'   },
      { id: 'tab-achievements',section: '#tab-achievements',sidebarTab: 'tab-achievements' },
      { id: 'tab-comments',    section: '.comments-card',   sidebarTab: null              },
      { id: 'tab-upsell',      section: '.upsell-card-vip', sidebarTab: null              },
    ];

    blockMap.forEach(({ id, section, sidebarTab }) => {
      const isBlocked = blocks.includes(id);
      applyBlockVisibility(section, sidebarTab, isBlocked, isAdmin);
    });
    
    // Atualiza os toggles visuais no painel se o usuário for o admin
    syncAdminTogglesUI();
    
  } catch (e) {
    console.error("Falha ao carregar as configurações do Administrador:", e);
  }
}

// Oculta completamente ou exibe um elemento bloqueado e seu botão na sidebar
function applyBlockVisibility(sectionSelector, sidebarTabId, isBlocked, isAdmin) {
  const section = document.querySelector(sectionSelector);

  // Botão correspondente na sidebar (se existir)
  const sidebarBtn = sidebarTabId
    ? document.querySelector(`.nav-tab-btn[data-tab="${sidebarTabId}"]`)
    : null;

  if (isBlocked && !isAdmin) {
    // Oculta a seção de conteúdo
    if (section) section.classList.add('hidden');

    // Oculta o botão da sidebar
    if (sidebarBtn) sidebarBtn.classList.add('hidden');

    // Se a aba ativa for a que foi bloqueada, navega para a aba de aulas
    if (sidebarBtn && sidebarBtn.classList.contains('active')) {
      const defaultTab = document.querySelector('.nav-tab-btn[data-tab="tab-classes"]');
      if (defaultTab) defaultTab.click();
    }
  } else {
    // Restaura visibilidade
    if (section) section.classList.remove('hidden');

    // Restaura o botão da sidebar (exceto botões que têm hidden permanente como admin/webhook)
    if (sidebarBtn && !sidebarBtn.id) {
      sidebarBtn.classList.remove('hidden');
    }
  }
}

// Sincroniza os Toggles do painel com as configurações carregadas
function syncAdminTogglesUI() {
  const blocks = currentAdminConfig.blockedElements || [];
  
  const tPodclasses = document.getElementById('toggle-block-podclasses');
  const tExercises = document.getElementById('toggle-block-exercises');
  const tAchievements = document.getElementById('toggle-block-achievements');
  const tComments = document.getElementById('toggle-block-comments');
  const tUpsell = document.getElementById('toggle-block-upsell');
  
  if (tPodclasses) tPodclasses.checked = blocks.includes('tab-podclasses');
  if (tExercises) tExercises.checked = blocks.includes('tab-exercises');
  if (tAchievements) tAchievements.checked = blocks.includes('tab-achievements');
  if (tComments) tComments.checked = blocks.includes('tab-comments');
  if (tUpsell) tUpsell.checked = blocks.includes('tab-upsell');
  
  const announcementInput = document.getElementById('admin-announcement-input');
  if (announcementInput) announcementInput.value = currentAdminConfig.adminAnnouncement || "";
}

// Salva as configurações de administrador no backend
async function saveAdminConfig(updatedConfig) {
  try {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedConfig)
    });
    
    if (res.ok) {
      // Recarrega as travas de imediato
      loadAdminLocksAndAnnouncement();
    }
  } catch (e) {
    console.error("Erro ao salvar configurações do Admin:", e);
    alert("Falha ao salvar configurações no servidor.");
  }
}

// Configura os listeners dedicados do painel de controle
function extendAdminDashboardListeners() {
  // Listeners para os toggles de bloqueio
  const toggles = [
    { id: 'toggle-block-podclasses', val: 'tab-podclasses' },
    { id: 'toggle-block-exercises', val: 'tab-exercises' },
    { id: 'toggle-block-achievements', val: 'tab-achievements' },
    { id: 'toggle-block-comments', val: 'tab-comments' },
    { id: 'toggle-block-upsell', val: 'tab-upsell' }
  ];
  
  toggles.forEach(toggle => {
    const el = document.getElementById(toggle.id);
    if (el) {
      el.addEventListener('change', () => {
        let blocks = [...currentAdminConfig.blockedElements];
        if (el.checked) {
          if (!blocks.includes(toggle.val)) blocks.push(toggle.val);
        } else {
          blocks = blocks.filter(b => b !== toggle.val);
        }
        
        saveAdminConfig({
          blockedElements: blocks,
          adminAnnouncement: currentAdminConfig.adminAnnouncement
        });
      });
    }
  });

  // Salvar Comunicado
  const btnSaveAnn = document.getElementById('btn-save-announcement');
  if (btnSaveAnn) {
    btnSaveAnn.addEventListener('click', () => {
      const txt = document.getElementById('admin-announcement-input').value.trim();
      saveAdminConfig({
        blockedElements: currentAdminConfig.blockedElements,
        adminAnnouncement: txt
      });
      alert("Banner de Comunicado Global atualizado com sucesso!");
    });
  }

  // Remover Comunicado
  const btnClearAnn = document.getElementById('btn-clear-announcement');
  if (btnClearAnn) {
    btnClearAnn.addEventListener('click', () => {
      document.getElementById('admin-announcement-input').value = "";
      saveAdminConfig({
        blockedElements: currentAdminConfig.blockedElements,
        adminAnnouncement: ""
      });
      alert("Comunicado removido!");
    });
  }

  // Formulário de Criação Manual de Aluna
  const createUserForm = document.getElementById('admin-create-user-form');
  if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('admin-create-name').value.trim();
      const email = document.getElementById('admin-create-email').value.trim();
      const role = document.getElementById('admin-create-role').value;
      
      try {
        const response = await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, role })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          alert(`Usuário registrado com sucesso!\n\nE-mail: ${email}\nSenha Padrão: doce123`);
          
          document.getElementById('admin-create-name').value = '';
          document.getElementById('admin-create-email').value = '';
          
          // Recarrega tabela
          loadAdminUsersTable();
        } else {
          alert("Erro ao cadastrar: " + (result.error || "Erro desconhecido"));
        }
      } catch (err) {
        console.error("Falha ao registrar aluna manualmente:", err);
      }
    });
  }
}

// Carrega e renderiza a tabela de usuárias
async function loadAdminUsersTable() {
  const tableBody = document.getElementById('admin-users-table-body');
  if (!tableBody) return;
  
  try {
    const res = await fetch('/api/admin/users');
    if (!res.ok) return;
    
    const users = await res.json();
    
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="padding:15px; text-align:center; color:var(--text-creme-dark);">Nenhuma aluna cadastrada.</td></tr>`;
      return;
    }
    
    users.forEach(user => {
      const dateStr = new Date(user.createdAt).toLocaleDateString('pt-BR');
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--glass-border)';
      
      tr.innerHTML = `
        <td style="padding: 12px 15px; font-weight:600; color:#fff;">${user.name}</td>
        <td style="padding: 12px 15px; color:var(--text-creme-muted);">${user.email}</td>
        <td style="padding: 12px 15px;">
          <span class="status-badge ${user.status === 'active' ? 'active' : 'inactive'}">
            ${user.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td style="padding: 12px 15px; color:var(--text-creme-dark); font-size:0.78rem;">${user.origin || 'manual'}</td>
        <td style="padding: 12px 15px;"><span class="badge" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1);">${user.role || 'student'}</span></td>
        <td style="padding: 12px 15px; text-align:center;">
          <button class="btn-table-action toggle-status" data-email="${user.email}">
            ${user.status === 'active' ? '<i class="fa-solid fa-user-slash" style="margin-right: 4px;"></i>Inativar' : '<i class="fa-solid fa-user-check" style="margin-right: 4px;"></i>Ativar'}
          </button>
          <button class="btn-table-action delete-user" data-email="${user.email}">
            <i class="fa-solid fa-trash-can" style="margin-right: 4px;"></i>Excluir
          </button>
        </td>
      `;
      
      // Hook de inativar/ativar
      tr.querySelector('.toggle-status').addEventListener('click', async () => {
        const email = user.email;
        try {
          const finalRes = await fetch('/api/admin/users/toggle-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          if (finalRes.ok) {
            loadAdminUsersTable();
          }
        } catch (e) {
          console.error("Falha ao mudar status da aluna:", e);
        }
      });
      
      // Hook de excluir
      tr.querySelector('.delete-user').addEventListener('click', async () => {
        const email = user.email;
        if (user.role === 'admin') {
          alert("Não é possível excluir a conta do Administrador!");
          return;
        }
        if (!confirm(`Deseja realmente excluir permanentemente o cadastro de ${user.name}?`)) {
          return;
        }
        
        try {
          const deleteRes = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
            method: 'DELETE'
          });
          if (deleteRes.ok) {
            loadAdminUsersTable();
          }
        } catch (e) {
          console.error("Falha ao excluir aluna:", e);
        }
      });
      
      tableBody.appendChild(tr);
    });
  } catch (e) {
    console.error("Erro ao carregar tabela de alunas:", e);
  }
}

// A inicialização estendida dos listeners do Painel Admin é feita
// diretamente no encerramento da função setupPremiumLXDEngine().

// ================= ADMIN COURSE MANAGER =================

function renderAdminCourseManager() {
  const container = document.getElementById('admin-course-manager');
  if (!container) return;

  container.innerHTML = '';
  courseData.forEach(mod => {
    const modSection = document.createElement('div');
    modSection.className = 'acm-module-block';
    modSection.dataset.moduleId = mod.id;
    modSection.innerHTML = `
      <div class="acm-module-header">
        <div class="acm-module-title">
          <i class="fa-solid fa-layer-group" style="color:var(--accent-honey); margin-right:8px;"></i>
          <strong>${mod.title}</strong>
        </div>
        <div class="acm-module-actions">
          <button class="btn btn-sm btn-secondary" onclick="openModuleModal(${mod.id}, '${mod.title.replace(/'/g, "\\'")}')">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button class="btn btn-sm" style="background:rgba(220,50,50,0.2); color:#ff6b6b; border:1px solid rgba(220,50,50,0.3);" onclick="deleteModule(${mod.id})">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <button class="btn btn-sm btn-accent" onclick="openLessonModal(null, ${mod.id})">
            <i class="fa-solid fa-plus"></i> Nova Aula
          </button>
        </div>
      </div>
      <div class="acm-lessons-list" id="acm-lessons-${mod.id}">
        ${(mod.lessons || []).map(les => `
          <div class="acm-lesson-item" data-lesson-id="${les.id}">
            <div class="acm-lesson-info">
              ${les.iframe_url ? '<i class="fa-brands fa-youtube" style="color:#ff4444; margin-right:6px;"></i>' : '<i class="fa-solid fa-play-circle" style="color:var(--accent-honey); margin-right:6px;"></i>'}
              <span>${les.title}</span>
              <span class="acm-duration"><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${les.duration}</span>
              ${les.attachments && les.attachments.length > 0 ? `<span class="acm-attachments-badge"><i class="fa-solid fa-paperclip" style="margin-right:3px;"></i>${les.attachments.length}</span>` : ''}
            </div>
            <div class="acm-lesson-actions">
              <button class="btn btn-sm btn-secondary" onclick="openLessonModal(${les.id}, ${mod.id})">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm" style="background:rgba(220,50,50,0.2); color:#ff6b6b; border:1px solid rgba(220,50,50,0.3);" onclick="deleteLesson(${les.id})">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(modSection);
  });
}

function openModuleModal(moduleId = null, currentTitle = '') {
  const existing = document.getElementById('acm-module-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'acm-module-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="checkout-card" style="max-width:480px;">
      <button class="btn-close-modal" onclick="document.getElementById('acm-module-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
      <h3 style="color:#fff; margin-bottom:1.5rem; font-family:var(--font-headings);">
        <i class="fa-solid fa-layer-group" style="color:var(--accent-honey); margin-right:8px;"></i>
        ${moduleId ? 'Editar Módulo' : 'Novo Módulo'}
      </h3>
      <div class="input-group">
        <label>Título do Módulo</label>
        <input type="text" id="acm-mod-title-input" value="${currentTitle}" placeholder="Ex: Módulo 1: Introdução ao Método">
      </div>
      <div style="display:flex; gap:10px; margin-top:1.5rem;">
        <button class="btn btn-primary" style="flex:1;" onclick="saveModule(${moduleId})">
          <i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>Salvar
        </button>
        <button class="btn btn-secondary" onclick="document.getElementById('acm-module-modal').remove()">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function saveModule(moduleId) {
  const title = document.getElementById('acm-mod-title-input')?.value?.trim();
  if (!title) return alert('Digite o título do módulo.');

  try {
    const method = moduleId ? 'PUT' : 'POST';
    const url = moduleId ? `/api/admin/course/modules/${moduleId}` : '/api/admin/course/modules';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, sort_order: courseData.length })
    });
    if (!res.ok) throw new Error('Erro ao salvar módulo');
    document.getElementById('acm-module-modal')?.remove();
    await loadCourseData();
    updateProgressBar(); // Recalcula o progresso
    renderAccordion();
    renderAdminCourseManager();
    if (activeLesson) loadLessonData(activeLesson);
  } catch (e) {
    alert('Erro ao salvar módulo: ' + e.message);
  }
}

async function deleteModule(moduleId) {
  if (!confirm('Tem certeza que quer excluir este módulo e todas as suas aulas?')) return;
  try {
    await fetch(`/api/admin/course/modules/${moduleId}`, { method: 'DELETE' });
    await loadCourseData();
    updateProgressBar(); // Recalcula o progresso após deletar
    renderAccordion();
    renderAdminCourseManager();
    activeLesson = courseData[0]?.lessons?.[0] || null;
    if (activeLesson) loadLessonData(activeLesson);
  } catch (e) {
    alert('Erro ao excluir módulo');
  }
}

let _lessonModalAttachments = [];

function openLessonModal(lessonId = null, moduleId = null) {
  const existing = document.getElementById('acm-lesson-modal');
  if (existing) existing.remove();

  let lesson = null;
  if (lessonId) {
    for (const mod of courseData) {
      lesson = (mod.lessons || []).find(l => l.id == lessonId);
      if (lesson) break;
    }
  }

  _lessonModalAttachments = lesson ? [...(lesson.attachments || [])] : [];
  const stepsText = lesson ? (lesson.steps || []).join('\n') : '';

  const modal = document.createElement('div');
  modal.id = 'acm-lesson-modal';
  modal.className = 'modal-overlay';
  modal.style.zIndex = '1100';
  modal.innerHTML = `
    <div class="checkout-card" style="max-width:660px; max-height:90vh; overflow-y:auto;">
      <button class="btn-close-modal" onclick="document.getElementById('acm-lesson-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
      <h3 style="color:#fff; margin-bottom:1.5rem; font-family:var(--font-headings);">
        <i class="fa-solid fa-clapperboard" style="color:var(--accent-honey); margin-right:8px;"></i>
        ${lessonId ? 'Editar Aula' : 'Nova Aula'}
      </h3>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
        <div class="input-group" style="grid-column:1/-1;">
          <label>Título da Aula</label>
          <input type="text" id="acm-les-title" value="${lesson ? lesson.title : ''}" placeholder="Ex: 1.1 Introdução ao Módulo">
        </div>
        <div class="input-group">
          <label>Duração</label>
          <input type="text" id="acm-les-duration" value="${lesson ? lesson.duration : '10 min'}" placeholder="Ex: 12 min">
        </div>
        <div class="input-group" style="grid-column:1/-1;">
          <label><i class="fa-solid fa-film" style="color:var(--accent-honey); margin-right:6px;"></i>URL do Vídeo (iframe)</label>
          <input type="url" id="acm-les-iframe" value="${lesson ? (lesson.iframe_url || '') : ''}" placeholder="Cole qualquer link do YouTube ou Vimeo (será convertido automaticamente)">
          <small id="acm-iframe-hint" style="color:var(--text-creme-muted); font-size:0.75rem; margin-top:4px; display:block;">
            <i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>Cole o link normal do YouTube/Vimeo. O sistema converte automaticamente para embed.
          </small>
        </div>
        <div class="input-group" style="grid-column:1/-1;">
          <label>Grande Conclusão / Resumo</label>
          <textarea id="acm-les-conclusion" rows="2" style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:8px; padding:10px; color:#fff;" placeholder="O que a aluna vai aprender...">${lesson ? (lesson.conclusion || '') : ''}</textarea>
        </div>
        <div class="input-group" style="grid-column:1/-1;">
          <label>Por Que Isso Acontece (Fundamentação)</label>
          <textarea id="acm-les-rationale" rows="3" style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:8px; padding:10px; color:#fff;" placeholder="Explicação científica ou estratégica...">${lesson ? (lesson.rationale || '') : ''}</textarea>
        </div>
        <div class="input-group" style="grid-column:1/-1;">
          <label>Passos Práticos (um por linha)</label>
          <textarea id="acm-les-steps" rows="4" style="width:100%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:8px; padding:10px; color:#fff;" placeholder="Passo 1&#10;Passo 2&#10;Passo 3">${stepsText}</textarea>
        </div>
      </div>

      <!-- Materiais de Apoio -->
      <div style="margin-top:1.5rem; padding:1rem; background:rgba(0,0,0,0.2); border-radius:8px; border:1px solid var(--glass-border);">
        <h4 style="color:var(--accent-honey); margin-bottom:1rem; font-size:0.95rem;">
          <i class="fa-solid fa-paperclip" style="margin-right:6px;"></i>Materiais de Apoio
        </h4>

        <!-- Upload de Arquivo -->
        <div style="display:flex; gap:10px; align-items:flex-end; margin-bottom:1rem;">
          <div class="input-group" style="flex:1; margin-bottom:0;">
            <label style="font-size:0.78rem;">Upload de Arquivo (PDF, imagem, etc.)</label>
            <input type="file" id="acm-file-upload" style="background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:8px; padding:8px; color:#fff; width:100%;">
          </div>
          <button class="btn btn-accent" style="white-space:nowrap; height:43px;" onclick="uploadLessonFile()">
            <i class="fa-solid fa-cloud-arrow-up" style="margin-right:6px;"></i>Enviar
          </button>
        </div>

        <!-- Inserir Link -->
        <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:10px; align-items:flex-end; margin-bottom:1rem;">
          <div class="input-group" style="margin-bottom:0;">
            <label style="font-size:0.78rem;">Nome do Link</label>
            <input type="text" id="acm-link-name" placeholder="Ex: Slides do Módulo">
          </div>
          <div class="input-group" style="margin-bottom:0;">
            <label style="font-size:0.78rem;">URL do Link</label>
            <input type="url" id="acm-link-url" placeholder="https://...">
          </div>
          <button class="btn btn-secondary" style="height:43px; white-space:nowrap;" onclick="addLessonLink()">
            <i class="fa-solid fa-plus"></i> Adicionar
          </button>
        </div>

        <!-- Lista de Anexos -->
        <div id="acm-attachments-list" style="display:flex; flex-direction:column; gap:8px;"></div>
      </div>

      <div style="display:flex; gap:10px; margin-top:1.5rem;">
        <button class="btn btn-primary" style="flex:1;" onclick="saveLesson(${lessonId}, ${moduleId})">
          <i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>Salvar Aula
        </button>
        <button class="btn btn-secondary" onclick="document.getElementById('acm-lesson-modal').remove()">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  renderModalAttachments();

  // Adiciona listener para conversão automática de URL de vídeo
  const iframeInput = document.getElementById('acm-les-iframe');
  const iframeHint = document.getElementById('acm-iframe-hint');

  if (iframeInput && iframeHint) {
    const handleUrlConversion = () => {
      const originalUrl = iframeInput.value.trim();
      if (!originalUrl) {
        iframeHint.innerHTML = '<i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>Cole o link normal do YouTube/Vimeo. O sistema converte automaticamente para embed.';
        iframeHint.style.color = 'var(--text-creme-muted)';
        return;
      }

      const convertedUrl = convertToEmbedUrl(originalUrl);

      if (convertedUrl !== originalUrl) {
        // URL foi convertida
        iframeInput.value = convertedUrl;
        iframeHint.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right:4px; color:#4ade80;"></i>URL convertida automaticamente para formato embed!';
        iframeHint.style.color = '#4ade80';

        // Volta para a cor normal após 3 segundos
        setTimeout(() => {
          iframeHint.innerHTML = '<i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>Cole o link normal do YouTube/Vimeo. O sistema converte automaticamente para embed.';
          iframeHint.style.color = 'var(--text-creme-muted)';
        }, 3000);
      } else if (originalUrl.includes('embed') || originalUrl.includes('player.vimeo')) {
        // URL já está no formato correto
        iframeHint.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right:4px; color:#4ade80;"></i>URL já está no formato embed correto!';
        iframeHint.style.color = '#4ade80';

        setTimeout(() => {
          iframeHint.innerHTML = '<i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>Cole o link normal do YouTube/Vimeo. O sistema converte automaticamente para embed.';
          iframeHint.style.color = 'var(--text-creme-muted)';
        }, 3000);
      }
    };

    // Converte quando o campo perde o foco
    iframeInput.addEventListener('blur', handleUrlConversion);

    // Converte quando o usuário cola algo
    iframeInput.addEventListener('paste', () => {
      setTimeout(handleUrlConversion, 100);
    });
  }
}

function renderModalAttachments() {
  const list = document.getElementById('acm-attachments-list');
  if (!list) return;
  if (_lessonModalAttachments.length === 0) {
    list.innerHTML = '<p style="color:var(--text-creme-muted); font-size:0.82rem; text-align:center;">Nenhum material adicionado ainda.</p>';
    return;
  }
  list.innerHTML = _lessonModalAttachments.map((att, i) => `
    <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:8px; border:1px solid var(--glass-border);">
      <i class="fa-solid ${att.type === 'link' ? 'fa-link' : 'fa-file'}" style="color:var(--accent-honey);"></i>
      <span style="flex:1; font-size:0.85rem; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${att.name || att.originalName}</span>
      <a href="${att.url}" target="_blank" class="btn btn-sm btn-secondary" style="padding:4px 8px;"><i class="fa-solid fa-eye"></i></a>
      <button class="btn btn-sm" style="background:rgba(220,50,50,0.2); color:#ff6b6b; border:1px solid rgba(220,50,50,0.3); padding:4px 8px;" onclick="removeLessonAttachment(${i})">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

async function uploadLessonFile() {
  const fileInput = document.getElementById('acm-file-upload');
  if (!fileInput || !fileInput.files[0]) return alert('Selecione um arquivo primeiro.');

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const btn = document.querySelector('[onclick="uploadLessonFile()"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...'; }

    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro no upload');

    _lessonModalAttachments.push({
      type: 'file',
      name: data.originalName,
      url: data.url,
      size: data.size
    });
    renderModalAttachments();
    fileInput.value = '';
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="margin-right:6px;"></i>Enviar'; }
  } catch (e) {
    alert('Erro no upload: ' + e.message);
    const btn = document.querySelector('[onclick="uploadLessonFile()"]');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="margin-right:6px;"></i>Enviar'; }
  }
}

function addLessonLink() {
  const name = document.getElementById('acm-link-name')?.value?.trim();
  const url = document.getElementById('acm-link-url')?.value?.trim();
  if (!name || !url) return alert('Preencha o nome e a URL do link.');
  _lessonModalAttachments.push({ type: 'link', name, url });
  renderModalAttachments();
  document.getElementById('acm-link-name').value = '';
  document.getElementById('acm-link-url').value = '';
}

function removeLessonAttachment(index) {
  _lessonModalAttachments.splice(index, 1);
  renderModalAttachments();
}

// Converte URLs de vídeo para formato embed correto
function convertToEmbedUrl(url) {
  if (!url || url.trim() === '') return '';

  url = url.trim();

  // If the user pasted an entire iframe code or HTML snippet, try to extract the src
  if (url.includes('<iframe') || url.includes('src=')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1];
    }
  }

  // YouTube - vários formatos
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://m.youtube.com/watch?v=VIDEO_ID
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  // https://vimeo.com/VIDEO_ID
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Se já estiver no formato embed correto ou for outro player, retorna como está
  return url;
}

async function saveLesson(lessonId, moduleId) {
  const title = document.getElementById('acm-les-title')?.value?.trim();
  const duration = document.getElementById('acm-les-duration')?.value?.trim() || '10 min';
  const iframe_url_raw = document.getElementById('acm-les-iframe')?.value?.trim() || '';
  const iframe_url = convertToEmbedUrl(iframe_url_raw); // Converte automaticamente
  const conclusion = document.getElementById('acm-les-conclusion')?.value?.trim() || '';
  const rationale = document.getElementById('acm-les-rationale')?.value?.trim() || '';
  const stepsRaw = document.getElementById('acm-les-steps')?.value?.trim() || '';
  const steps = stepsRaw.split('\n').map(s => s.trim()).filter(Boolean);
  const attachments = [..._lessonModalAttachments];

  if (!title) return alert('Digite o título da aula.');

  try {
    const method = lessonId ? 'PUT' : 'POST';
    const url = lessonId ? `/api/admin/course/lessons/${lessonId}` : '/api/admin/course/lessons';
    const body = lessonId
      ? { title, duration, iframe_url, conclusion, rationale, steps, attachments }
      : { module_id: moduleId, title, duration, iframe_url, conclusion, rationale, steps, attachments };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Erro ao salvar aula');

    document.getElementById('acm-lesson-modal')?.remove();
    await loadCourseData();
    updateProgressBar(); // Recalcula o progresso
    renderAccordion();
    renderAdminCourseManager();
    if (activeLesson) loadLessonData(activeLesson);
  } catch (e) {
    alert('Erro ao salvar aula: ' + e.message);
  }
}

async function deleteLesson(lessonId) {
  if (!confirm('Tem certeza que quer excluir esta aula?')) return;
  try {
    await fetch(`/api/admin/course/lessons/${lessonId}`, { method: 'DELETE' });
    if (activeLesson && String(activeLesson.id) === String(lessonId)) {
      activeLesson = courseData[0]?.lessons?.[0] || null;
    }
    await loadCourseData();
    updateProgressBar(); // Recalcula o progresso após deletar
    renderAccordion();
    renderAdminCourseManager();
    if (activeLesson) loadLessonData(activeLesson);
  } catch (e) {
    alert('Erro ao excluir aula');
  }
}

// ================= ADMIN BONUS MANAGER =================

function renderAdminBonusManager() {
  const container = document.getElementById('admin-bonus-manager');
  if (!container) return;

  if (bonusData.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-creme-muted);">Nenhum bônus cadastrado. Clique em "Novo Bônus" para começar.</p>';
    return;
  }

  let html = `<div class="bonus-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">`;
  
  bonusData.forEach(bonus => {
    html += `
      <div style="background:var(--card-glass); border:1px solid var(--glass-border); border-radius:12px; padding:1.5rem; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
          <div style="display:flex; align-items:center; gap:0.8rem;">
            <div style="width:40px; height:40px; border-radius:8px; background:rgba(255,160,122,0.1); display:flex; align-items:center; justify-content:center; color:var(--accent-honey);">
              <i class="fa-solid ${bonus.icon}"></i>
            </div>
            <div>
              <h4 style="margin:0; font-size:1rem; color:#fff;">${bonus.title}</h4>
              <small style="color:var(--text-creme-muted);">Destrava com: ${bonus.unlock_hint}</small>
            </div>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.1); color:#fff;" onclick="openBonusModal(${bonus.id})" title="Editar Bônus"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm" style="background:rgba(255,100,100,0.1); color:var(--primary-strawberry);" onclick="deleteBonus(${bonus.id})" title="Excluir Bônus"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <p style="font-size:0.88rem; color:var(--text-creme); margin-bottom:1rem;">${bonus.description}</p>
        ${bonus.file_url ? `<span style="font-size:0.75rem; background:rgba(100,255,100,0.1); color:#88ff88; padding:2px 8px; border-radius:12px;"><i class="fa-solid fa-paperclip"></i> Arquivo Anexado</span>` : ''}
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

let _currentBonusFileUrl = '';
let _currentBonusActionText = '';

function openBonusModal(bonusId = null) {
  let bonus = null;
  if (bonusId) {
    bonus = bonusData.find(b => String(b.id) === String(bonusId));
  }
  
  _currentBonusFileUrl = bonus ? (bonus.file_url || '') : '';
  let _currentBonusCheckoutUrl = bonus ? (bonus.checkout_url || '') : '';
  _currentBonusActionText = bonus ? (bonus.action_text || 'Acessar') : 'Acessar';

  const modalHtml = `
    <div id="acm-bonus-modal" class="modal-overlay" style="z-index:9999; display:flex;">
      <div class="checkout-card premium-glow" style="max-width:500px; width:90%; max-height:90vh; overflow-y:auto;">
        <button class="btn-close-modal" onclick="document.getElementById('acm-bonus-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
        <h3 style="color:#fff; margin-bottom:1.5rem;"><i class="fa-solid fa-gift" style="color:var(--accent-honey); margin-right:8px;"></i>${bonus ? 'Editar Bônus' : 'Novo Bônus'}</h3>
        
        <div class="form-group" style="margin-bottom:1rem;">
          <label style="color:var(--text-creme-muted); font-size:0.85rem;">Título do Bônus</label>
          <input type="text" id="acm-bonus-title" class="webhook-input" value="${bonus ? bonus.title : ''}" placeholder="Ex: 5 Receitas Secretas" style="width:100%;">
        </div>
        
        <div class="form-group" style="margin-bottom:1rem;">
          <label style="color:var(--text-creme-muted); font-size:0.85rem;">Descrição</label>
          <textarea id="acm-bonus-desc" class="webhook-input" placeholder="Ex: Receitas de bolo sem açúcar" style="width:100%; min-height:60px;">${bonus ? bonus.description : ''}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
          <div class="form-group">
            <label style="color:var(--text-creme-muted); font-size:0.85rem;">Ícone (FontAwesome)</label>
            <input type="text" id="acm-bonus-icon" class="webhook-input" value="${bonus ? bonus.icon : 'fa-gift'}" placeholder="Ex: fa-book" style="width:100%;">
          </div>
          <div class="form-group">
            <label style="color:var(--text-creme-muted); font-size:0.85rem;">Texto do Botão</label>
            <input type="text" id="acm-bonus-action" class="webhook-input" value="${_currentBonusActionText}" placeholder="Ex: Baixar PDF" style="width:100%;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
          <div class="form-group">
            <label style="color:var(--text-creme-muted); font-size:0.85rem;">ID da Conquista (Gatilho)</label>
            <select id="acm-bonus-ach-id" class="webhook-input" style="width:100%;">
              <option value="ach-first-step" ${bonus && bonus.unlock_achievement_id === 'ach-first-step' ? 'selected' : ''}>Primeiros Passos</option>
              <option value="ach-diary" ${bonus && bonus.unlock_achievement_id === 'ach-diary' ? 'selected' : ''}>Diário Iniciado</option>
              <option value="ach-master" ${bonus && bonus.unlock_achievement_id === 'ach-master' ? 'selected' : ''}>Mestre Dieta do Doce</option>
              <option value="order_bump_7816706" ${bonus && bonus.unlock_achievement_id === 'order_bump_7816706' ? 'selected' : ''}>Order Bump (ID 7816706)</option>
            </select>
          </div>
          <div class="form-group">
            <label style="color:var(--text-creme-muted); font-size:0.85rem;">Dica Visível</label>
            <input type="text" id="acm-bonus-hint" class="webhook-input" value="${bonus ? bonus.unlock_hint : 'Primeiros Passos'}" placeholder="Ex: Primeiros Passos" style="width:100%;">
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem;">
          <label style="color:var(--text-creme-muted); font-size:0.85rem;">Dias para Liberação (0 = Imediato)</label>
          <input type="number" id="acm-bonus-release-days" class="webhook-input" value="${bonus && bonus.release_days !== undefined ? bonus.release_days : 0}" min="0" style="width:100%;">
          <p style="font-size:0.8rem; color:var(--text-creme-muted); margin-top:4px;">Define a quantidade de dias após o cadastro para liberar este bônus. Se também houver uma Conquista definida acima, ambas as condições precisarão ser atendidas.</p>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px; border:1px solid var(--glass-border);">
          <label style="color:var(--text-creme-muted); font-size:0.85rem; display:block; margin-bottom:0.5rem;">Arquivo ou Link do Bônus (Quando Desbloqueado)</label>
          <p style="font-size:0.8rem; color:var(--accent-honey); margin-bottom:0.5rem;">(Use 'certificate' para acionar o modal de Certificado Oficial)</p>
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="acm-bonus-file-url" class="webhook-input" value="${_currentBonusFileUrl}" placeholder="URL ou 'certificate'" style="width:100%;">
            <input type="file" id="acm-bonus-file-upload" style="display:none;" onchange="uploadBonusFile(this)">
            <button class="btn btn-sm" style="background:var(--card-glass); border:1px solid var(--glass-border); color:#fff; white-space:nowrap;" onclick="document.getElementById('acm-bonus-file-upload').click()">
              <i class="fa-solid fa-upload"></i> Subir
            </button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:1.5rem; background:rgba(255,100,100,0.05); padding:1rem; border-radius:8px; border:1px solid rgba(255,100,100,0.2);">
          <label style="color:#ff8888; font-size:0.85rem; display:block; margin-bottom:0.5rem;">Link de Checkout (Quando Bloqueado)</label>
          <p style="font-size:0.8rem; color:var(--text-creme-muted); margin-bottom:0.5rem;">Exclusivo para Order Bumps e Upsells. Para onde o aluno vai quando clicar em "Comprar Agora"?</p>
          <input type="text" id="acm-bonus-checkout-url" class="webhook-input" value="${_currentBonusCheckoutUrl}" placeholder="Ex: https://go.hotmart.com/..." style="width:100%; border-color:rgba(255,100,100,0.3);">
        </div>

        <button class="btn btn-primary btn-block" onclick="saveBonus(${bonusId ? `'${bonusId}'` : 'null'})">Salvar Bônus</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function uploadBonusFile(input) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  
  const btn = input.nextElementSibling;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subindo...';
  
  try {
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      document.getElementById('acm-bonus-file-url').value = data.url;
      _currentBonusFileUrl = data.url;
    } else {
      alert("Erro ao subir arquivo.");
    }
  } catch (e) {
    alert("Erro de conexão ao subir arquivo.");
  } finally {
    btn.innerHTML = originalText;
    input.value = '';
  }
}

async function saveBonus(bonusId) {
  const title = document.getElementById('acm-bonus-title').value.trim();
  const description = document.getElementById('acm-bonus-desc').value.trim();
  const icon = document.getElementById('acm-bonus-icon').value.trim();
  const action_text = document.getElementById('acm-bonus-action').value.trim();
  const unlock_achievement_id = document.getElementById('acm-bonus-ach-id').value;
  const unlock_hint = document.getElementById('acm-bonus-hint').value.trim();
  const file_url = document.getElementById('acm-bonus-file-url').value.trim();
  const checkout_url = document.getElementById('acm-bonus-checkout-url').value.trim();
  const release_days = parseInt(document.getElementById('acm-bonus-release-days').value) || 0;

  if (!title) return alert("O título é obrigatório!");

  try {
    const method = bonusId ? 'PUT' : 'POST';
    const url = bonusId ? `/api/admin/bonuses/${bonusId}` : '/api/admin/bonuses';
    const body = { title, description, icon, action_text, unlock_achievement_id, unlock_hint, file_url, checkout_url, release_days };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Erro ao salvar bônus');

    document.getElementById('acm-bonus-modal')?.remove();
    await loadBonusData();
    renderAdminBonusManager();
    // Atualizar UI do usuário
    checkAchievements();
  } catch (e) {
    alert('Erro ao salvar bônus: ' + e.message);
  }
}

async function deleteBonus(bonusId) {
  if (!confirm('Tem certeza que quer excluir este bônus?')) return;
  try {
    await fetch(`/api/admin/bonuses/${bonusId}`, { method: 'DELETE' });
    await loadBonusData();
    renderAdminBonusManager();
    checkAchievements();
  } catch (e) {
    alert('Erro ao excluir bônus');
  }
}
