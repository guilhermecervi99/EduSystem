import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS, ERROR_MESSAGES } from '../utils/constants';

// ===== DEBUG ADICIONADO =====
console.log('🌐 API module loading...');
console.log('🔗 API_BASE_URL:', API_BASE_URL);

// Configuração base do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== DEBUG INTERCEPTORS ADICIONADOS =====
let requestCount = 0;
const activeRequests = new Map();

// Request interceptor para debug
api.interceptors.request.use(
  (config) => {
    requestCount++;
    const requestId = `req_${requestCount}`;
    activeRequests.set(requestId, {
      url: config.url,
      method: config.method?.toUpperCase(),
      timestamp: Date.now()
    });
    
    console.log(`🚀 [${requestId}] API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Log se há muitas requests simultâneas
    if (activeRequests.size > 5) {
      console.warn(`⚠️ Muitas requests simultâneas: ${activeRequests.size}`);
      console.log('Active requests:', Array.from(activeRequests.values()));
    }
    
    config.metadata = { requestId };

    // Adicionar token de autenticação
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 [${requestId}] Token added to request`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor para debug
api.interceptors.response.use(
  (response) => {
    const requestId = response.config.metadata?.requestId;
    if (requestId && activeRequests.has(requestId)) {
      const request = activeRequests.get(requestId);
      const duration = Date.now() - request.timestamp;
      console.log(`✅ [${requestId}] API Response: ${response.status} ${request.method} ${request.url} (${duration}ms)`);
      activeRequests.delete(requestId);
    }
    
    return response;
  },
  (error) => {
    const requestId = error.config?.metadata?.requestId;
    if (requestId && activeRequests.has(requestId)) {
      const request = activeRequests.get(requestId);
      const duration = Date.now() - request.timestamp;
      console.error(`❌ [${requestId}] API Error: ${error.response?.status || 'NETWORK'} ${request.method} ${request.url} (${duration}ms)`);
      activeRequests.delete(requestId);
    }

    if (error.response) {
      // Erro de resposta HTTP
      const { status, data } = error.response;
      
      console.error(`🚨 HTTP Error ${status}:`, data);
      
      switch (status) {
        case 401:
          // Token expirado ou inválido
          console.log('🔑 Token expired/invalid, clearing storage');
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/welcome';
          throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
        
        case 403:
          throw new Error(ERROR_MESSAGES.FORBIDDEN);
        
        case 404:
          throw new Error(ERROR_MESSAGES.NOT_FOUND);
        
        case 422:
          // Erro de validação
          const message = data?.detail || ERROR_MESSAGES.VALIDATION_ERROR;
          throw new Error(Array.isArray(message) ? message[0].msg : message);
        
        case 500:
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        
        default:
          throw new Error(data?.detail || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } else if (error.request) {
      // Erro de rede
      console.error('🌐 Network Error:', error.request);
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Outro tipo de erro
      console.error('💥 Other Error:', error.message);
      throw new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }
);

// Serviços de API organizados por módulo

// Autenticação
export const authAPI = {
  async register(userData) {
    console.log('📝 authAPI.register called');
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    console.log('🔑 authAPI.login called');
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password || '');
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  async getCurrentUser() {
    console.log('👤 authAPI.getCurrentUser called');
    const response = await api.get('/auth/me');
    console.log('👤 getCurrentUser response:', response.data);
    return response.data;
  },

  async refreshToken() {
    console.log('🔄 authAPI.refreshToken called');
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async logout() {
    console.log('🚪 authAPI.logout called');
    await api.post('/auth/logout');
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

// Mapeamento de Interesses
export const mappingAPI = {
  async startMapping() {
    const response = await api.post('/mapping/start');
    return response.data;
  },

  async submitMapping(mappingData) {
    const response = await api.post('/mapping/submit', mappingData);
    return response.data;
  },

  async analyzeText(text) {
    const response = await api.post('/mapping/analyze-text', { text });
    return response.data;
  },

  async getMappingHistory() {
    const response = await api.get('/mapping/history');
    return response.data;
  },

  async getAvailableAreas() {
    const response = await api.get('/mapping/areas');
    return response.data;
  },
};

// Progresso
export const progressAPI = {
  async getCurrentProgress() {
    console.log('📊 Executando getCurrentProgress...');
    const response = await api.get('/progress/current');
    return response.data;
  },

  async getCurrentContent() {
    console.log('📚 Executando getCurrentContent...');
    const response = await api.get('/progress/current-content');
    return response.data;
  },

  async completeLesson(lessonData) {
    console.log('📤 Enviando para API:', lessonData);
    const response = await api.post('/progress/lesson/complete', lessonData);
    return response.data;
  },

  async completeModule(moduleData) {
    const response = await api.post('/progress/module/complete', moduleData);
    return response.data;
  },

  async completeLevel(levelData) {
    const response = await api.post('/progress/level/complete', levelData);
    return response.data;
  },

  async getStatistics() {
    const response = await api.get('/progress/statistics');
    return response.data;
  },

  async getProgressPath() {
    const response = await api.get('/progress/path');
    return response.data;
  },

  async getNextSteps() {
    const response = await api.get('/progress/next-steps');
    return response.data;
  },

  async advanceProgress(stepType) {
    const response = await api.post(`/progress/advance?step_type=${stepType}`);
    return response.data;
  },

  async switchTrack(newTrack) {
    const response = await api.post('/progress/switch-track', { new_track: newTrack });
    return response.data;
  },

  async navigateTo(navigationData) {
    try {
      const requiredFields = ['area', 'subarea', 'level', 'module_index'];
      const missingFields = requiredFields.filter(field => 
        navigationData[field] === undefined || navigationData[field] === null
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      }
      
      const validatedData = {
        area: navigationData.area,
        subarea: navigationData.subarea,
        level: navigationData.level,
        module_index: parseInt(navigationData.module_index) || 0,
        lesson_index: parseInt(navigationData.lesson_index) || 0,
        step_index: parseInt(navigationData.step_index) || 0
      };
      
      console.log('📤 Enviando navegação para API:', validatedData);
      const response = await api.post('/progress/navigate-to', validatedData);
      console.log('✅ Navegação realizada com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Navigation error:', error);
      
      if (error.response?.status === 404) {
        console.log('🔄 Tentando criar progresso inicial...');
        try {
          const createResponse = await api.post('/progress/initialize', {
            ...validatedData,
            set_as_current: true
          });
          console.log('✅ Progresso inicial criado:', createResponse.data);
          return createResponse.data;
        } catch (createError) {
          console.error('❌ Erro ao criar progresso inicial:', createError);
          throw createError;
        }
      }
      
      throw error;
    }
  },

  async navigatePrevious() {
    try {
      const response = await api.post('/progress/navigate/previous');
      console.log('✅ Navegação anterior realizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao navegar para anterior:', error);
      throw error;
    }
  },

  async getProgressForAreaSubarea(area, subarea) {
    try {
      const response = await api.get('/progress/area-subarea', {
        params: { area, subarea }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async hasProgressInAreaSubarea(area, subarea) {
    try {
      const progress = await this.getProgressForAreaSubarea(area, subarea);
      return !!(progress && progress.has_progress && (
        progress.module_index > 0 || 
        progress.lesson_index > 0 || 
        progress.step_index > 0 ||
        progress.completed_lessons > 0
      ));
    } catch (error) {
      return false;
    }
  },

  async initializeProgress(area, subarea, level = 'iniciante', setAsCurrent = false) {
    try {
      const response = await api.post('/progress/initialize', {
        area,
        subarea,
        level,
        module_index: 0,
        lesson_index: 0,
        step_index: 0,
        set_as_current: setAsCurrent
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao inicializar progresso:', error);
      throw error;
    }
  },

  async completeAndAdvance(lessonData) {
    try {
      if (!lessonData.lesson_title) {
        throw new Error('lesson_title é obrigatório');
      }

      const dataWithAdvance = {
        ...lessonData,
        advance_progress: true
      };

      const response = await api.post('/progress/lesson/complete', dataWithAdvance);
      console.log('✅ Lição completada e progresso avançado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Complete and advance error:', error);
      throw error;
    }
  },

  async getTodayProgress() {
    try {
      const response = await api.get('/progress/today');
      return response.data;
    } catch (error) {
      return {
        lessons_completed: 0,
        modules_completed: 0,
        study_time_minutes: 0
      };
    }
  },

  async getWeeklyProgress() {
    try {
      const response = await api.get('/progress/weekly');
      return response.data;
    } catch (error) {
      return {
        target: 5,
        completed: 0
      };
    }
  },

  async completeAssessment(assessmentData) {
    const response = await api.post('/progress/assessment/complete', assessmentData);
    return response.data;
  },

  async startSpecialization(specData) {
    const response = await api.post('/progress/specialization/start', specData);
    return response.data;
  },

  async registerSpecializationCompletion(specName, area, subarea) {
    const response = await api.post('/progress/specialization/complete', {
      spec_name: specName,
      area_name: area,
      subarea_name: subarea
    });
    return response.data;
  },
};

// Conquistas
export const achievementsAPI = {
  async getUserAchievements() {
    const response = await api.get('/achievements/');
    return response.data;
  },

  async getUserBadges(category = null) {
    const params = category ? { category } : {};
    const response = await api.get('/achievements/badges', { params });
    return response.data;
  },

  async checkNewAchievements() {
    const response = await api.post('/achievements/check');
    return response.data;
  },

  async getLeaderboard(category = 'xp', limit = 10) {
    const response = await api.get('/achievements/leaderboard', {
      params: { category, limit },
    });
    return response.data;
  },

  async getStudyStreak() {
    const response = await api.get('/achievements/streak');
    return response.data;
  },

  async getXPHistory(days = 30) {
    const response = await api.get('/achievements/xp-history', {
      params: { days },
    });
    return response.data;
  },

  async getAvailableAchievements() {
    const response = await api.get('/achievements/available');
    return response.data;
  },
};

// Projetos
export const projectsAPI = {
  async getUserProjects(statusFilter = null, projectType = null, limit = 20) {
    const params = {};
    if (statusFilter) params.status_filter = statusFilter;
    if (projectType) params.project_type = projectType;
    params.limit = limit;

    const response = await api.get('/projects/', { params });
    return response.data;
  },

  async createProject(projectData) {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  async getProjectDetails(projectId) {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  async updateProject(projectId, updateData) {
    const response = await api.put(`/projects/${projectId}`, updateData);
    return response.data;
  },

  async completeProject(projectId, submissionData) {
    const response = await api.post(`/projects/${projectId}/complete`, submissionData);
    return response.data;
  },

  async submitProjectFeedback(projectId, feedbackData) {
    const response = await api.post(`/projects/${projectId}/feedback`, feedbackData);
    return response.data;
  },

  async getAvailableProjects(area, subarea, level = 'iniciante') {
    const response = await api.get(`/projects/available/${area}/${subarea}`, {
      params: { level },
    });
    return response.data;
  },

  async searchProjects(query, projectType = null, status = null, limit = 10) {
    const params = { query, limit };
    if (projectType) params.project_type = projectType;
    if (status) params.status = status;

    const response = await api.get('/projects/search', { params });
    return response.data;
  },
};

// LLM/Professor Virtual
export const llmAPI = {
  async askTeacher(question, context = '') {
    const response = await api.post('/llm/ask-teacher', { question, context });
    return response.data;
  },

  async generateLesson(lessonData) {
    const response = await api.post('/llm/generate-lesson', lessonData);
    return response.data;
  },

  async generateAssessment(assessmentData) {
    const response = await api.post('/llm/generate-assessment', assessmentData);
    return response.data;
  },

  async generateLearningPath(pathData) {
    const response = await api.post('/llm/generate-learning-path', pathData);
    return response.data;
  },

  async analyzeContent(content) {
    const response = await api.post('/llm/analyze-content', { content });
    return response.data;
  },

  async simplifyContent(content, targetAge = null) {
    const data = { content };
    if (targetAge) data.target_age = targetAge;
    
    const response = await api.post('/llm/simplify-content', data);
    return response.data;
  },

  async enrichContent(contextData) {
    try {
      console.log('🚀 [enrichContent] Chamando API com:', contextData);
      
      const response = await api.post('/llm/enrich-content', contextData);
      
      console.log('📥 [enrichContent] Resposta raw:', response.data);
      
      // Garantir que sempre retornamos a estrutura esperada
      // O backend retorna { enriched_content, type, context_used, xp_earned }
      if (response.data && response.data.enriched_content) {
        console.log('✅ [enrichContent] Conteúdo enriquecido encontrado');
        return response.data;
      }
      
      // Se por algum motivo não tiver enriched_content, criar estrutura
      console.warn('⚠️ [enrichContent] Resposta sem enriched_content, criando estrutura');
      return {
        enriched_content: response.data || 'Erro: conteúdo não recebido',
        type: contextData.enrichment_type || contextData.type || 'unknown',
        xp_earned: 0
      };
      
    } catch (error) {
      console.error('❌ [enrichContent] Erro na requisição:', error);
      
      // Se for erro 422, pode ser problema de validação
      if (error.response?.status === 422) {
        console.error('🚫 Erro de validação:', error.response.data);
      }
      
      throw error;
    }
  },

  async getTeachingStyles() {
    const response = await api.get('/llm/teaching-styles');
    return response.data;
  },

  async applyAssessment(assessmentData) {
    const response = await api.post('/llm/apply-assessment', assessmentData);
    return response.data;
  },
};

// Recursos Educacionais
export const resourcesAPI = {
  async getLearningResources(area, subarea = null, level = null, category = null) {
    const params = {};
    if (subarea) params.subarea = subarea;
    if (level) params.level = level;
    if (category) params.category = category;

    const response = await api.get(`/resources/learning/${area}`, { params });
    return response.data;
  },

  async registerResourceAccess(resourceData) {
    const response = await api.post('/resources/access', resourceData);
    return response.data;
  },

  async submitResourceFeedback(feedbackData) {
    const response = await api.post('/resources/feedback', feedbackData);
    return response.data;
  },

  async getCareerExploration(area, subarea = null) {
    const params = subarea ? { subarea } : {};
    const response = await api.get(`/resources/careers/${area}`, { params });
    return response.data;
  },

  async getSpecializations(area, subarea) {
    const response = await api.get(`/resources/specializations/${area}/${subarea}`);
    return response.data;
  },

  async getStudyPlan() {
    const response = await api.get('/resources/study-plan');
    return response.data;
  },

  async searchResources(query, area = null, resourceType = null, level = null, limit = 20) {
    const params = { query, limit };
    if (area) params.area = area;
    if (resourceType) params.resource_type = resourceType;
    if (level) params.level = level;

    const response = await api.get('/resources/search', { params });
    return response.data;
  },
};

// Usuários
export const usersAPI = {
  async getUserProfile(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  async updateUser(userId, updateData) {
    const response = await api.put(`/users/${userId}`, updateData);
    return response.data;
  },

  async getUserStatistics(userId) {
    const response = await api.get(`/users/${userId}/statistics`);
    return response.data;
  },

  async getUserProgress(userId) {
    const response = await api.get(`/users/${userId}/progress`);
    return response.data;
  },

  async updatePreferences(userId, preferences) {
    const response = await api.put(`/users/${userId}/preferences`, preferences);
    return response.data;
  },

  async getNextLevelInfo(userId) {
    const response = await api.get(`/users/${userId}/next-level-info`);
    return response.data;
  },

  async checkUserAchievements(userId) {
    const response = await api.post(`/users/${userId}/check-achievements`);
    return response.data;
  },

  async searchUsers(query = null, track = null, minLevel = null, limit = 10) {
    const params = { limit };
    if (query) params.q = query;
    if (track) params.track = track;
    if (minLevel) params.min_level = minLevel;

    const response = await api.get('/users/search', { params });
    return response.data;
  },

  async submitFeedback(userId, contentType, rating, comments = '', sessionType = 'general') {
    const params = {
      content_type: contentType,
      rating,
      comments,
      session_type: sessionType,
    };
    const response = await api.post(`/users/${userId}/feedback`, null, { params });
    return response.data;
  },

  async getUserEngagement(userId, days = 30) {
    const response = await api.get(`/users/${userId}/engagement`, {
      params: { days },
    });
    return response.data;
  },

  async getPersonalizedSuggestions(userId) {
    const response = await api.get(`/users/${userId}/personalized-suggestions`);
    return response.data;
  },
};

// Content API
export const contentAPI = {
  async browseAreas(includeMetadata = true) {
    const response = await api.get('/content/areas', {
      params: { include_metadata: includeMetadata }
    });
    return response.data;
  },

  async getAreaDetails(areaName) {
    const response = await api.get(`/content/areas/${areaName}`);
    return response.data;
  },

  async getSubareaDetails(areaName, subareaName) {
    const response = await api.get(`/content/areas/${areaName}/subareas/${subareaName}`);
    return response.data;
  },

  async setCurrentArea(areaName, subareaName = null) {
    const params = subareaName ? { subarea_name: subareaName } : {};
    const response = await api.post(`/content/areas/${areaName}/set-current`, null, { params });
    return response.data;
  },

  async getLevelDetails(areaName, subareaName, levelName) {
    const response = await api.get(
      `/content/areas/${encodeURI(areaName)}/subareas/${encodeURI(subareaName)}/levels/${encodeURI(levelName)}`
    );
    return response.data;
  },

  async getModuleDetails(areaName, subareaName, levelName, moduleIndex) {
    const response = await api.get(
      `/content/areas/${areaName}/subareas/${subareaName}/levels/${levelName}/modules/${moduleIndex}`
    );
    return response.data;
  },

  async searchContent(query, contentTypes = ['all'], limit = 20) {
    const response = await api.get('/content/search/content', {
      params: {
        q: query,
        content_types: contentTypes,
        limit
      }
    });
    return response.data;
  }
};

// Feedback API
export const feedbackAPI = {
  async collectFeedback(feedbackData) {
    const response = await api.post('/feedback/collect', feedbackData);
    return response.data;
  },

  async getFeedbackAnalysis(days = 30) {
    const response = await api.get('/feedback/analysis', { params: { days } });
    return response.data;
  },

  async adaptRecommendations(force = false) {
    const response = await api.post('/feedback/adapt', null, { params: { force } });
    return response.data;
  },

  async getImprovementSuggestions() {
    const response = await api.get('/feedback/suggestions');
    return response.data;
  },

  async getFeedbackHistory(limit = 20, offset = 0, sessionType = null) {
    const params = { limit, offset };
    if (sessionType) params.session_type = sessionType;
    const response = await api.get('/feedback/history', { params });
    return response.data;
  }
};

// ===== DEBUG FUNCTIONS ADICIONADAS =====
export const debugAPI = {
  getActiveRequests: () => Array.from(activeRequests.entries()),
  getRequestCount: () => requestCount,
  clearStats: () => {
    requestCount = 0;
    activeRequests.clear();
  },
  testAuthAPI: () => {
    console.log('🔍 AuthAPI methods:', Object.keys(authAPI));
    console.log('🔍 getCurrentUser exists:', typeof authAPI.getCurrentUser);
    
    if (typeof authAPI.getCurrentUser === 'function') {
      console.log('✅ getCurrentUser is a function');
    } else {
      console.error('❌ getCurrentUser is not a function!');
    }
  },
  async testConnection() {
    console.log('🧪 Testing API connection...');
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      console.log('🏥 Health check response:', response.status);
      return response.ok;
    } catch (error) {
      console.error('💥 API connection test failed:', error);
      return false;
    }
  }
};

// Adicionar ao window para debug no console
window.debugAPI = debugAPI;

// Detectar possíveis loops infinitos
setInterval(() => {
  if (activeRequests.size > 10) {
    console.error('🚨 POSSÍVEL LOOP INFINITO DE API CALLS!');
    console.log('Requests ativas:', Array.from(activeRequests.values()));
  }
}, 5000);

console.log('✅ API module loaded successfully');

// Exportação da instância do axios para casos especiais
export default api;