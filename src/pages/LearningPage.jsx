import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  MessageCircle, 
  Send,
  Lightbulb,
  Star,
  Award,
  Play,
  Pause,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Grid, 
  List, 
  Lock,
  Clock,
  Unlock, 
  PlayCircle, 
  CheckCircle2, 
  BookOpen as BookOpenIcon,
  X,
  Target,
  Circle
} from 'lucide-react';
import api, { progressAPI, llmAPI, contentAPI, resourcesAPI } from '../services/api';
import ReactMarkdown from 'react-markdown'; 
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

// Função helper para converter LaTeX em texto legível
const convertLatexToReadable = (content) => {
  if (!content) return '';
  
  let processed = content;
  
  // Converter expressões LaTeX completas com parênteses
  processed = processed.replace(/\$?\$?\\sqrt\{([^}]+)\}\$?\$?/g, (match, inner) => {
    return `√(${inner})`;
  });
  
  // Converter frações
  processed = processed.replace(/\$?\$?\\frac\{([^}]+)\}\{([^}]+)\}\$?\$?/g, (match, num, den) => {
    return `(${num}/${den})`;
  });
  
  // Converter potências
  processed = processed.replace(/\^(\d+)/g, (match, exp) => {
    const superscripts = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
    return exp.split('').map(d => superscripts[d] || d).join('');
  });
  
  // Converter expressões em parênteses com LaTeX
  processed = processed.replace(/\(([^)]*\\[^)]+)\)/g, (match, inner) => {
    let cleanInner = inner
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\^(\d+)/g, (m, exp) => {
        const superscripts = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
        return exp.split('').map(d => superscripts[d] || d).join('');
      });
    return `(${cleanInner})`;
  });
  
  // Converter operadores matemáticos
  processed = processed
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠');
  
  // Converter [ ] para formato legível
  processed = processed.replace(/\[\s*\\text\{([^}]+)\}\s*=\s*([^]]+)\]/g, (match, text, equation) => {
    const cleanEquation = equation
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/R\$/g, 'R$')
      .trim();
    
    return `\n**${text} = ${cleanEquation}**\n`;
  });
  
  // Converter outras expressões entre [ ]
  processed = processed.replace(/\[\s*([^\]]+)\s*\]/g, (match, equation) => {
    const cleanEquation = equation
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\s+/g, ' ')
      .trim();
    
    return `\n**${cleanEquation}**\n`;
  });
  
  // Remover $ extras que possam ter sobrado
  processed = processed.replace(/\$([^$]+)\$/g, '$1');
  
  return processed;
};

// Função de debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const LearningPage = ({ onNavigate }) => {
  console.log('🚀 LearningPage - Renderizando componente');
  
  // Refs para controle
  const requestCache = useRef(new Map());
  const pendingRequests = useRef(new Map());
  const lastProgressRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadingContentRef = useRef(false);
  
  const [loadingLevelData, setLoadingLevelData] = useState(false);
  const { user, updateUser } = useAuth();
  const { 
    completeLesson, 
    currentProgress, 
    loadProgress,
    navigateAndUpdateProgress,
    isNavigating: globalIsNavigating,
    setNavigating: setGlobalNavigating 
  } = useApp();
  const { showSuccess, showError, showInfo } = useNotification();
  const [levelData, setLevelData] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showTeacherChat, setShowTeacherChat] = useState(false);
  const [teacherQuestion, setTeacherQuestion] = useState('');
  const [teacherResponse, setTeacherResponse] = useState('');
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [showSpecializationChoice, setShowSpecializationChoice] = useState(false);
  
  // Estados para navegação melhorada
  const [viewMode, setViewMode] = useState('current');
  const [subareaDetails, setSubareaDetails] = useState(null);
  const [availableSpecializations, setAvailableSpecializations] = useState([]);
  const [expandedLevels, setExpandedLevels] = useState({});
  const [loadingStructure, setLoadingStructure] = useState(false);
  
  // Estados para avaliação
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  
  // Estados para análise de conteúdo
  const [showContentOptions, setShowContentOptions] = useState(false);
  const [alternativeContent, setAlternativeContent] = useState(null);
  const [enrichedContent, setEnrichedContent] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Estados para feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRatings, setFeedbackRatings] = useState({
    relevance: 1,
    clarity: 1,
    usefulness: 1,
    difficulty: 1,
    engagement: 1
  });
  const [suggestions, setSuggestions] = useState('');
  const [missingTopics, setMissingTopics] = useState('');

  // Estado para o ContentAnalysisTools
  const [enrichedDataState, setEnrichedDataState] = useState({
    exemplos: null,
    analogias: null,
    perguntas: null,
    aplicacoes: null
  });

  const [activeTabState, setActiveTabState] = useState(null);
  const [showToolsState, setShowToolsState] = useState(false);
  
  // Estado local para navegação
  const [localIsNavigating, setLocalIsNavigating] = useState(false);

  // Combinar estado de navegação
  const isNavigating = globalIsNavigating || localIsNavigating;

  // Usar useMemo para calcular valores derivados
  const progressInfo = useMemo(() => {
    if (!currentProgress) return null;
    
    return {
      exists: !!currentProgress,
      area: currentProgress?.area,
      subarea: currentProgress?.subarea,
      level: currentProgress?.level,
      module_index: currentProgress?.module_index,
      lesson_index: currentProgress?.lesson_index,
      step_index: currentProgress?.step_index,
      isComplete: !!(
        currentProgress?.area && 
        currentProgress?.subarea && 
        currentProgress?.level !== undefined
      )
    };
  }, [currentProgress]);

  // DEBUG: Log do currentProgress sempre que mudar
  useEffect(() => {
    console.log('🔍 LearningPage - progressInfo:', progressInfo);
  }, [progressInfo]);

  // Salvar último progresso válido no ref
  useEffect(() => {
    if (progressInfo?.isComplete && currentProgress) {
      lastProgressRef.current = { ...currentProgress };
      console.log('💾 Salvando progresso válido no ref:', lastProgressRef.current);
    }
  }, [progressInfo, currentProgress]);

  // Limpar dados enriquecidos quando mudar de conteúdo
  useEffect(() => {
    if (currentContent?.id || currentContent?.title) {
      console.log('🔄 Novo conteúdo detectado, limpando enriquecimentos');
      setEnrichedDataState({
        exemplos: null,
        analogias: null,
        perguntas: null,
        aplicacoes: null
      });
      setActiveTabState(null);
    }
  }, [currentContent?.id, currentContent?.title]);

  // Salvar contexto atual no sessionStorage para recuperação
  useEffect(() => {
    if (progressInfo?.isComplete && currentProgress) {
      const progressToSave = {
        area: currentProgress.area,
        subarea: currentProgress.subarea,
        level: currentProgress.level,
        module_index: currentProgress.module_index || 0,
        lesson_index: currentProgress.lesson_index || 0,
        step_index: currentProgress.step_index || 0
      };
      console.log('💾 Salvando no sessionStorage:', progressToSave);
      sessionStorage.setItem('lastValidProgress', JSON.stringify(progressToSave));
    }
  }, [progressInfo, currentProgress]);

  // Callback memoizado para carregar dados do nível
  const loadLevelData = useCallback(async (forceLevel = null) => {
    console.log('📊 loadLevelData - Iniciando');
    
    const levelToLoad = forceLevel || progressInfo?.level;
    
    if (!progressInfo?.area || !progressInfo?.subarea || !levelToLoad) {
      console.log('❌ Dados insuficientes para carregar nível');
      return;
    }
    
    // Criar chave única para o cache
    const cacheKey = `${progressInfo.area}-${progressInfo.subarea}-${levelToLoad}`;
    
    // Verificar se já está em cache
    if (!forceLevel && requestCache.current.has(cacheKey)) {
      const cachedData = requestCache.current.get(cacheKey);
      console.log('📦 Usando dados do cache para:', cacheKey);
      setLevelData(cachedData);
      return cachedData;
    }
    
    // Verificar se já há uma requisição pendente
    if (pendingRequests.current.has(cacheKey)) {
      console.log('⏳ Aguardando requisição pendente para:', cacheKey);
      try {
        const pendingData = await pendingRequests.current.get(cacheKey);
        setLevelData(pendingData);
        return pendingData;
      } catch (error) {
        console.error('❌ Erro na requisição pendente:', error);
      }
      return;
    }
    
    setLoadingLevelData(true);
    
    try {
      console.log('📚 Carregando dados do nível:', {
        area: progressInfo.area,
        subarea: progressInfo.subarea,
        level: levelToLoad
      });
      
      // Criar promise e armazenar como pendente
      const promise = contentAPI.getLevelDetails(
        progressInfo.area,
        progressInfo.subarea,
        levelToLoad
      );
      
      pendingRequests.current.set(cacheKey, promise);
      
      const data = await promise;
      
      console.log('✅ Dados do nível carregados:', {
        level: levelToLoad,
        modules: data.modules?.length,
        data: data
      });
      
      // Adicionar ao cache
      requestCache.current.set(cacheKey, data);
      
      // Remover da lista de pendentes
      pendingRequests.current.delete(cacheKey);
      
      if (isMountedRef.current) {
        setLevelData(data);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao carregar dados do nível:', error);
      pendingRequests.current.delete(cacheKey);
    } finally {
      if (isMountedRef.current) {
        setLoadingLevelData(false);
      }
    }
  }, [progressInfo]);

  // Callback memoizado para carregar conteúdo atual
  const loadCurrentContent = useCallback(async () => {
    console.log('📖 loadCurrentContent - Iniciando carregamento de conteúdo');
    
    if (loadingContentRef.current) {
      console.log('⏳ Já carregando conteúdo, ignorando...');
      return;
    }
    
    loadingContentRef.current = true;
    setLoadingContent(true);
    
    try {
      const content = await progressAPI.getCurrentContent();
      console.log('📖 Conteúdo recebido:', content);
      
      if (!content.title) {
        console.log('⚠️ Conteúdo sem título, tentando gerar um');
        if (content.context?.lesson) {
          content.title = content.context.lesson;
        } else if (content.content_type === 'step' && content.context) {
          content.title = `${content.context.module} - ${content.context.lesson || 'Lição'}`;
        } else {
          content.title = content.content_type === 'step' ? 'Passo de Aprendizado' : 'Lição';
        }
        console.log('📝 Título gerado:', content.title);
      }
      
      if (!content.context) {
        console.log('⚠️ Conteúdo sem contexto, gerando contexto padrão');
        const fallbackProgress = currentProgress || lastProgressRef.current;
        content.context = {
          area: fallbackProgress?.area || user?.current_track || 'Geral',
          subarea: fallbackProgress?.subarea || user?.current_subarea || 'Geral',
          level: fallbackProgress?.level || 'iniciante',
          module: `Módulo ${(fallbackProgress?.module_index || 0) + 1}`,
          lesson: content.title
        };
        console.log('📝 Contexto gerado:', content.context);
      }
      
      if (isMountedRef.current) {
        setCurrentContent(content);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar conteúdo:', error);
      showError('Erro ao carregar conteúdo: ' + error.message);
      
      const fallbackProgress = currentProgress || lastProgressRef.current;
      const fallbackContent = {
        title: 'Erro ao carregar',
        content: 'Não foi possível carregar o conteúdo. Por favor, recarregue a página.',
        content_type: 'error',
        context: {
          area: fallbackProgress?.area || user?.current_track || 'Geral',
          subarea: fallbackProgress?.subarea || user?.current_subarea || 'Geral',
          level: fallbackProgress?.level || 'iniciante',
          module: 'Módulo 1'
        },
        navigation: {
          has_previous: false,
          has_next: true
        }
      };
      
      console.log('🆘 Usando conteúdo fallback:', fallbackContent);
      if (isMountedRef.current) {
        setCurrentContent(fallbackContent);
      }
    } finally {
      loadingContentRef.current = false;
      if (isMountedRef.current) {
        setLoadingContent(false);
      }
    }
  }, [currentProgress, user, showError]);

// Callback memoizado para carregar estrutura da subárea
const loadSubareaStructure = useCallback(async () => {
  console.log('🏗️ loadSubareaStructure - Iniciando');
  if (!progressInfo?.area || !progressInfo?.subarea) {
    console.log('❌ Dados insuficientes para carregar estrutura');
    return;
  }
  
  setLoadingStructure(true);
  try {
    console.log('🏗️ Buscando estrutura para:', {
      area: progressInfo.area,
      subarea: progressInfo.subarea
    });
    
    const response = await api.get(`/content/areas/${progressInfo.area}/subareas/${progressInfo.subarea}`);
    console.log('🏗️ Estrutura recebida:', response.data);
    if (isMountedRef.current) {
      setSubareaDetails(response.data);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar estrutura:', error);
    try {
      console.log('🔄 Tentando fallback para carregar estrutura');
      const details = await contentAPI.getSubareaDetails(
        progressInfo.area,
        progressInfo.subarea
      );
      console.log('✅ Estrutura carregada via fallback:', details);
      if (isMountedRef.current) {
        setSubareaDetails(details);
      }
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError);
    }
  } finally {
    if (isMountedRef.current) {
      setLoadingStructure(false);
    }
  }
}, [progressInfo]);

// Callback memoizado para carregar especializações
const loadSpecializations = useCallback(async () => {
  console.log('🌟 loadSpecializations - Iniciando');
  if (!progressInfo?.area || !progressInfo?.subarea) {
    console.log('❌ Dados insuficientes para carregar especializações');
    return;
  }
  
  try {
    console.log('🌟 Buscando especializações para:', {
      area: progressInfo.area,
      subarea: progressInfo.subarea
    });
    
    const specs = await resourcesAPI.getSpecializations(
      progressInfo.area, 
      progressInfo.subarea
    );
    console.log('✅ Especializações carregadas:', specs.length);
    if (isMountedRef.current) {
      setAvailableSpecializations(specs);
    }
  } catch (error) {
    console.error('❌ Erro ao carregar especializações:', error);
  }
}, [progressInfo]);

// Cleanup on unmount
useEffect(() => {
  return () => {
    isMountedRef.current = false;
  };
}, []);

// Effect principal para carregar dados do nível
useEffect(() => {
  if (!progressInfo?.isComplete || !isMountedRef.current) return;
  
  console.log('🎯 Effect - Carregando dados do nível');
  
  // Se mudou de nível, limpar cache
  if (levelData && levelData.level !== progressInfo.level) {
    console.log('📊 Nível mudou, limpando cache');
    requestCache.current.clear();
    setLevelData(null);
  }
  
  loadLevelData();
}, [progressInfo?.area, progressInfo?.subarea, progressInfo?.level, loadLevelData]);

// Effect inicial para carregar conteúdo
useEffect(() => {
  if (!isMountedRef.current) return;
  
  console.log('🏁 Effect - Montagem inicial do componente');
  loadCurrentContent();
}, []);

// Effect para recarregar conteúdo quando progresso mudar significativamente
useEffect(() => {
  if (!currentProgress || !isMountedRef.current) return;
  
  const lastProgress = lastProgressRef.current;
  if (!lastProgress) return;
  
  // Verificar se houve mudança significativa
  const significantChange = (
    lastProgress.level !== currentProgress.level ||
    lastProgress.module_index !== currentProgress.module_index ||
    lastProgress.lesson_index !== currentProgress.lesson_index ||
    lastProgress.step_index !== currentProgress.step_index
  );
  
  if (significantChange && !isNavigating && !loadingContent) {
    console.log('📍 Mudança significativa detectada, recarregando conteúdo');
    loadCurrentContent();
    
    // Se mudou de nível, recarregar dados
    if (lastProgress.level !== currentProgress.level) {
      loadLevelData();
    }
  }
}, [currentProgress, isNavigating, loadingContent, loadCurrentContent, loadLevelData]);

// Effect para estrutura e especializações
useEffect(() => {
  if (!progressInfo?.area || !progressInfo?.subarea || !isMountedRef.current) return;
  
  console.log('🏗️ Effect - Carregando estrutura e especializações');
  Promise.all([
    loadSubareaStructure(),
    loadSpecializations()
  ]);
}, [progressInfo?.area, progressInfo?.subarea, loadSubareaStructure, loadSpecializations]);

// Limpar cache quando mudar de área/subárea
useEffect(() => {
  return () => {
    console.log('🧹 Limpando cache de requisições');
    requestCache.current.clear();
    pendingRequests.current.clear();
  };
}, [progressInfo?.area]);

const navigateToSpecificContent = useCallback(async (level, moduleIndex, lessonIndex = 0) => {
  console.log('🧭 navigateToSpecificContent - Iniciando navegação:', {
      level,
      moduleIndex,
      lessonIndex
  });
  
  if (isNavigating || loadingContent) {
      console.log('⚠️ Navegação já em andamento');
      return;
  }
  
  try {
      setLocalIsNavigating(true);
      setLoadingContent(true);
      
      // Usar progresso válido
      const validProgress = currentProgress || lastProgressRef.current;
      
      if (!validProgress?.area || !validProgress?.subarea) {
          console.error('❌ Contexto de navegação incompleto');
          showError('Erro na navegação. Por favor, recarregue a página.');
          return;
      }
      
      const navigationData = {
          area: validProgress.area,
          subarea: validProgress.subarea,
          level: level,
          module_index: moduleIndex,
          lesson_index: lessonIndex,
          step_index: 0
      };
      
      console.log('📍 Navegando para:', navigationData);
      
      // Salvar no sessionStorage ANTES de navegar
      sessionStorage.setItem('lastValidProgress', JSON.stringify(navigationData));
      sessionStorage.setItem('targetNavigation', JSON.stringify(navigationData));
      
      // Usar a função do contexto para navegação
      await navigateAndUpdateProgress(navigationData);
      
      // Se mudou de nível, forçar recarga dos dados
      if (level !== validProgress.level) {
          console.log('📊 Nível mudou, recarregando dados');
          requestCache.current.clear();
          setLevelData(null);
          await loadLevelData(level);
      }
      
      // Recarregar conteúdo
      await loadCurrentContent();
      
      // Mudar para view atual
      setViewMode('current');
      showSuccess('Navegação atualizada!');
      
  } catch (error) {
      console.error('❌ Erro na navegação:', error);
      showError('Erro ao navegar: ' + error.message);
  } finally {
      setLocalIsNavigating(false);
      setLoadingContent(false);
      sessionStorage.removeItem('targetNavigation');
  }
}, [currentProgress, isNavigating, loadingContent, navigateAndUpdateProgress, loadCurrentContent, loadLevelData, showError, showSuccess]);

const navigateToLevel = useCallback(async (newLevel) => {
  console.log('📈 navigateToLevel - Navegando para nível:', newLevel);
  
  if (isNavigating) {
      console.log('⚠️ Navegação já em andamento');
      return;
  }
  
  try {
    setLocalIsNavigating(true);
    setLoadingContent(true);
    
    // Validar que o nível existe
    const validLevels = ['iniciante', 'intermediário', 'avançado'];
    if (!validLevels.includes(newLevel)) {
      console.error('❌ Nível inválido:', newLevel);
      showError('Nível inválido');
      return;
    }
    
    const validProgress = currentProgress || lastProgressRef.current;
    
    // Navegar para o início do novo nível
    const navigationData = {
      area: validProgress.area,
      subarea: validProgress.subarea,
      level: newLevel,
      module_index: 0,
      lesson_index: 0,
      step_index: 0
    };
    
    console.log('📍 Navegando para novo nível:', navigationData);
    
    // Usar navegação do contexto
    await navigateAndUpdateProgress(navigationData);
    
    // Limpar cache e recarregar dados do novo nível
    requestCache.current.clear();
    setLevelData(null);
    await loadLevelData(newLevel);
    
    // Recarregar conteúdo
    await loadCurrentContent();
    
    showSuccess(`Navegando para nível ${newLevel}`);
    setViewMode('current');
    
  } catch (error) {
    console.error('❌ Erro ao navegar para nível:', error);
    showError('Erro ao mudar de nível');
  } finally {
    setLocalIsNavigating(false);
    setLoadingContent(false);
  }
}, [currentProgress, isNavigating, navigateAndUpdateProgress, loadLevelData, loadCurrentContent, showError, showSuccess]);

const handlePreviousContent = useCallback(async () => {
  console.log('⬅️ handlePreviousContent - Voltando para conteúdo anterior');
  
  if (isNavigating) return;
  
  try {
    setLocalIsNavigating(true);
    await progressAPI.navigatePrevious();
    await loadProgress(true);
    await loadCurrentContent();
    showSuccess('Voltou para conteúdo anterior');
  } catch (error) {
    console.error('❌ Erro ao voltar:', error);
    showError('Erro ao voltar: ' + error.message);
  } finally {
    setLocalIsNavigating(false);
  }
}, [isNavigating, loadProgress, loadCurrentContent, showError, showSuccess]);

const handleCompleteAndAdvance = useCallback(async () => {
  console.log('➡️ handleCompleteAndAdvance - Iniciando avanço');
  
  if (!currentContent || !progressInfo?.isComplete || isNavigating) {
      console.error('❌ Dados insuficientes ou navegação em andamento:', {
          hasContent: !!currentContent,
          hasProgress: progressInfo?.isComplete,
          isNavigating
      });
      if (!progressInfo?.isComplete) {
          showError('Informações de progresso não disponíveis');
      }
      return;
  }

  // Usar progresso válido
  const progressContext = currentProgress || lastProgressRef.current;
  
  if (!progressContext) {
      console.error('❌ Nenhum progresso válido disponível');
      showError('Erro no progresso. Recarregando página...');
      await loadProgress(true);
      return;
  }

  setCompletingLesson(true);
  setLocalIsNavigating(true);
  
  try {
      // Garantir que levelData está carregado para o nível atual
      let moduleData = levelData;
      if (!moduleData || !moduleData.modules || moduleData.level !== progressContext.level) {
          console.log('📚 Carregando dados do módulo para o nível:', progressContext.level);
          moduleData = await loadLevelData(progressContext.level);
          if (!moduleData) {
              throw new Error('Não foi possível carregar dados do nível');
          }
      }

      const currentModuleIndex = progressContext.module_index || 0;
      const currentLessonIndex = progressContext.lesson_index || 0;
      const currentStepIndex = progressContext.step_index || 0;

      const currentModule = moduleData.modules?.[currentModuleIndex];
      if (!currentModule) {
          console.error('❌ Módulo não encontrado:', currentModuleIndex);
          showError('Erro ao encontrar módulo atual');
          return;
      }

      const currentLesson = currentModule.lessons?.[currentLessonIndex];
      if (!currentLesson) {
          console.error('❌ Lição não encontrada:', currentLessonIndex);
          showError('Erro ao encontrar lição atual');
          return;
      }

      const totalSteps = currentLesson.steps?.length || 4;
      const totalLessons = currentModule.lessons?.length || 0;
      const totalModules = moduleData.modules?.length || 0;

      console.log('📊 Estado atual:', {
          área: progressContext.area,
          subárea: progressContext.subarea,
          nível: progressContext.level,
          módulo: `${currentModuleIndex + 1}/${totalModules}`,
          lição: `${currentLessonIndex + 1}/${totalLessons}`,
          passo: `${currentStepIndex + 1}/${totalSteps}`
      });

      // Lógica de navegação
      let nextModuleIndex = currentModuleIndex;
      let nextLessonIndex = currentLessonIndex;
      let nextStepIndex = currentStepIndex + 1;

      // Se é uma lição sem passos (content_type === 'lesson')
      if (currentContent?.content_type === 'lesson') {
          console.log('📖 É uma lição completa, avançando para próxima lição');
          nextStepIndex = 0;
          nextLessonIndex = currentLessonIndex + 1;
      } 
      // Se completou todos os passos da lição atual
      else if (nextStepIndex >= totalSteps) {
          console.log('✅ Completou todos os passos da lição');
          nextStepIndex = 0;
          nextLessonIndex = currentLessonIndex + 1;
      }

      // Se completou todas as lições do módulo
      if (nextLessonIndex >= totalLessons) {
          console.log('✅ Completou todas as lições do módulo');
          
          // Completar módulo
          try {
              await progressAPI.completeModule({
                  module_title: currentModule.module_title || `Módulo ${currentModuleIndex + 1}`,
                  area_name: progressContext.area,
                  subarea_name: progressContext.subarea,
                  level_name: progressContext.level,
                  advance_progress: false
              });
              showSuccess('Módulo completado! 🎉');
          } catch (error) {
              if (!error.message?.includes('já foi completado')) {
                  console.error('❌ Erro ao completar módulo:', error);
              }
          }

          nextLessonIndex = 0;
          nextModuleIndex = currentModuleIndex + 1;
      }

      // Se completou todos os módulos do nível
      if (nextModuleIndex >= totalModules) {
          console.log('✅ Completou todos os módulos do nível');
          
          try {
              await progressAPI.completeLevel({
                  area_name: progressContext.area,
                  subarea_name: progressContext.subarea,
                  level_name: progressContext.level,
                  advance_progress: false
              });
              
              showSuccess('Parabéns! Você completou este nível! 🏆');
          } catch (error) {
              if (!error.message?.includes('já foi completado')) {
                  console.error('❌ Erro ao completar nível:', error);
              }
          }
          
          // Verificar próximo nível
          const levelsOrder = ['iniciante', 'intermediário', 'avançado'];
          const currentLevelIndex = levelsOrder.indexOf(progressContext.level);
          
          console.log('🔍 Verificando próximo nível:', {
              currentLevel: progressContext.level,
              currentIndex: currentLevelIndex,
              levelsOrder
          });
          
          if (currentLevelIndex < levelsOrder.length - 1) {
              // Avançar para próximo nível
              const nextLevel = levelsOrder[currentLevelIndex + 1];
              
              console.log('📈 Avançando para próximo nível:', nextLevel);
              
              const navigationData = {
                  area: progressContext.area,
                  subarea: progressContext.subarea,
                  level: nextLevel,
                  module_index: 0,
                  lesson_index: 0,
                  step_index: 0
              };
              
              await navigateAndUpdateProgress(navigationData);
              
              showSuccess(`Avançando para o nível ${nextLevel}!`);
              
              // Limpar cache e recarregar dados
              requestCache.current.clear();
              setLevelData(null);
              await loadLevelData(nextLevel);
              await loadCurrentContent();
              
              return;
          } else {
              // Completou nível avançado - mostrar especializações
              console.log('🌟 Nível avançado completado, mostrando especializações');
              await loadSpecializations();
              setShowSpecializationChoice(true);
              setCompletingLesson(false);
              setLocalIsNavigating(false);
              return;
          }
      }

      // Completar lição atual antes de navegar (se aplicável)
      if (currentContent?.content_type === 'step' && nextStepIndex === 0 && currentStepIndex === totalSteps - 1) {
          const lessonData = {
              lesson_title: currentLesson.lesson_title || `Lição ${currentLessonIndex + 1}`,
              area_name: progressContext.area,
              subarea_name: progressContext.subarea,
              level_name: progressContext.level,
              module_title: currentModule.module_title || `Módulo ${currentModuleIndex + 1}`,
              advance_progress: false
          };

          console.log('📝 Completando lição:', lessonData);

          try {
              const result = await progressAPI.completeLesson(lessonData);
              showSuccess(`Lição completada! +${result.xp_earned} XP`);
              updateUser({
                  profile_xp: (user.profile_xp || 0) + result.xp_earned
              });
          } catch (error) {
              if (!error.message?.includes('já foi completada')) {
                  console.error('❌ Erro ao completar lição:', error);
              }
          }
      }

      // Navegar para próximo conteúdo
      const nextPosition = {
          area: progressContext.area,
          subarea: progressContext.subarea,
          level: progressContext.level,
          module_index: nextModuleIndex,
          lesson_index: nextLessonIndex,
          step_index: nextStepIndex
      };
      
      console.log('📍 Navegando para próxima posição:', nextPosition);
      
      await navigateAndUpdateProgress(nextPosition);
      
      // Recarregar conteúdo
      await loadCurrentContent();
      
      // Se mudou de módulo, recarregar dados do nível
      if (nextModuleIndex !== currentModuleIndex) {
          console.log('📊 Mudou de módulo, recarregando dados');
          await loadLevelData();
      }

  } catch (error) {
      console.error('❌ Erro ao avançar:', error);
      showError('Erro ao avançar: ' + error.message);
  } finally {
      setCompletingLesson(false);
      setLocalIsNavigating(false);
  }
}, [currentContent, progressInfo, currentProgress, levelData, isNavigating, navigateAndUpdateProgress, loadLevelData, loadCurrentContent, loadProgress, loadSpecializations, showError, showSuccess, updateUser, user]);

const handleGenerateAssessment = useCallback(async (type = 'module', level = null) => {
  console.log('📝 handleGenerateAssessment - Gerando avaliação:', { type, level });
  try {
    const assessmentData = {
      topic: type === 'final' 
        ? `${progressInfo?.area} - ${progressInfo?.subarea} - Nível ${level}` 
        : currentContent?.title || 'Conceitos do módulo atual',
      difficulty: level || progressInfo?.level || 'iniciante',
      num_questions: type === 'final' ? 15 : 10,
      question_types: ['múltipla escolha', 'verdadeiro/falso', 'dissertativa']
    };
    
    console.log('📝 Dados da avaliação:', assessmentData);
    
    const response = await llmAPI.generateAssessment(assessmentData);
    setCurrentAssessment({
      ...response.assessment,
      type: type
    });
    setShowAssessmentModal(true);
  } catch (error) {
    console.error('❌ Erro ao gerar avaliação:', error);
    showError('Erro ao gerar avaliação: ' + error.message);
  }
}, [progressInfo, currentContent, showError]);

const handleStartSpecialization = useCallback(async (specialization) => {
  console.log('🌟 handleStartSpecialization - Iniciando especialização:', specialization);
  
  if (isNavigating) return;
  
  try {
    setLocalIsNavigating(true);
    
    await api.post('/progress/specialization/start', {
      spec_name: specialization.name,
      area: progressInfo.area,
      subarea: progressInfo.subarea
    });
    
    showSuccess(`Especialização "${specialization.name}" iniciada!`);
    await loadSpecializations();
    
    if (specialization.modules && specialization.modules.length > 0) {
      setViewMode('current');
    }
  } catch (error) {
    console.error('❌ Erro ao iniciar especialização:', error);
    showError('Erro ao iniciar especialização: ' + error.message);
  } finally {
    setLocalIsNavigating(false);
  }
}, [progressInfo, isNavigating, loadSpecializations, showError, showSuccess]);

const analyzeContent = useCallback(async () => {
  console.log('🔍 analyzeContent - Analisando conteúdo');
  setLoadingAnalysis(true);
  try {
    const analysis = await llmAPI.analyzeContent(currentContent.content);
    console.log('📊 Análise recebida:', analysis);
    
    if (analysis.vocabulário_complexidade === 'alto' || 
        analysis[`adequação_${user.age}_${user.age + 1}_anos`] < 0.7) {
      const simplified = await llmAPI.simplifyContent(currentContent.content, user.age);
      setAlternativeContent({
        type: 'simplified',
        content: simplified.simplified_content,
        reason: 'Conteúdo simplificado para melhor compreensão'
      });
    }
    
    setShowContentOptions(true);
  } catch (error) {
    console.error('❌ Erro ao analisar conteúdo:', error);
    showError('Erro ao analisar conteúdo');
  } finally {
    setLoadingAnalysis(false);
  }
}, [currentContent, user.age, showError]);



// Função para enviar feedback
const submitFeedback = useCallback(async () => {
  console.log('💬 submitFeedback - Enviando feedback');
  try {
    const feedbackData = {
      session_type: 'study',
      content_id: currentContent?.id || 'current',
      content_type: currentContent?.content_type || 'lesson',
      ratings: {
        // Campos obrigatórios
        relevance: feedbackRatings.relevance,
        clarity: feedbackRatings.clarity,
        usefulness: feedbackRatings.usefulness,
        // Campos opcionais
        difficulty: feedbackRatings.difficulty,
        engagement: feedbackRatings.engagement
      },
      missing_topics: missingTopics || null, // API espera string ou null
      suggestions: suggestions || null, // API espera string ou null
      context: {
        area: progressInfo?.area || user?.current_track || 'Geral',
        subarea: progressInfo?.subarea || user?.current_subarea || 'Geral',
        level: progressInfo?.level || 'iniciante',
        module: currentContent?.context?.module || 'Módulo Atual',
        lesson: currentContent?.title || 'Lição Atual'
      }
    };
    
    console.log('💬 Dados do feedback:', feedbackData);
    
    const response = await api.post('/feedback/collect', feedbackData);
    
    if (response.data.xp_earned) {
      updateUser({
        profile_xp: (user.profile_xp || 0) + response.data.xp_earned
      });
      showSuccess(`Obrigado pelo seu feedback! +${response.data.xp_earned} XP`);
    } else {
      showSuccess('Obrigado pelo seu feedback!');
    }
    
    // Limpar formulário
    setShowFeedback(false);
    setFeedbackRatings({
      relevance: 3,
      clarity: 3,
      usefulness: 3,
      difficulty: 3,
      engagement: 3
    });
    setSuggestions('');
    setMissingTopics('');
    
    // Tentar adaptar recomendações (não falhar se der erro)
    try {
      const adaptResult = await api.post('/feedback/adapt');
      if (adaptResult.data.adapted) {
        showInfo('Suas preferências foram atualizadas!');
      }
    } catch (adaptError) {
      console.log('Erro ao adaptar (não crítico):', adaptError);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar feedback:', error);
    
    // Tratamento específico para erro 422
    if (error.response?.status === 422 && error.response?.data?.detail) {
      const details = error.response.data.detail;
      if (Array.isArray(details)) {
        // Pydantic validation errors
        const errorMessages = details.map(err => {
          const field = err.loc?.join('.') || 'campo desconhecido';
          return `${field}: ${err.msg}`;
        }).join(', ');
        showError(`Erro de validação: ${errorMessages}`);
      } else {
        showError(`Erro de validação: ${details}`);
      }
    } else {
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao enviar feedback';
      showError('Erro ao enviar feedback: ' + errorMessage);
    }
  }
}, [currentContent, progressInfo, user, feedbackRatings, missingTopics, suggestions, updateUser, showError, showSuccess, showInfo]);

// Componente FeedbackWidget
const FeedbackWidget = React.memo(() => {
  console.log('💬 FeedbackWidget - Renderizando widget de feedback');
  return (
    <div className="mt-6 border-t pt-4">
      <button
        onClick={() => setShowFeedback(!showFeedback)}
        className="text-sm text-primary-600 hover:text-primary-700"
      >
        💭 Dar feedback sobre este conteúdo
      </button>
      
      {showFeedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Como foi sua experiência?</h4>
          
          <div className="space-y-3">
            {Object.entries({
              relevance: 'Relevância',
              clarity: 'Clareza',
              usefulness: 'Utilidade',
              difficulty: 'Dificuldade',
              engagement: 'Engajamento'
            }).map(([key, label]) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setFeedbackRatings(prev => ({ ...prev, [key]: value }))}
                      className={`w-8 h-8 rounded-full ${
                        feedbackRatings[key] >= value 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tópicos que gostaria de ver (separados por vírgula)
            </label>
            <input
              type="text"
              value={missingTopics}
              onChange={(e) => setMissingTopics(e.target.value)}
              placeholder="Ex: exemplos práticos, exercícios..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sugestões
            </label>
            <textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Como podemos melhorar?"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows="3"
            />
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedback(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={submitFeedback}
            >
              Enviar Feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

const handleAskTeacher = useCallback(async () => {
  console.log('👨‍🏫 handleAskTeacher - Perguntando ao professor');
  if (!teacherQuestion.trim()) return;

  setLoadingTeacher(true);
  try {
    const response = await llmAPI.askTeacher(
      teacherQuestion,
      currentContent ? `Estou estudando: ${currentContent.title}` : ''
    );
    
    console.log('👨‍🏫 Resposta do professor recebida');
    setTeacherResponse(response.answer);
    setTeacherQuestion('');
    
    updateUser({
      profile_xp: (user.profile_xp || 0) + response.xp_earned
    });

  } catch (error) {
    console.error('❌ Erro ao perguntar ao professor:', error);
    showError('Erro ao perguntar ao professor: ' + error.message);
  } finally {
    setLoadingTeacher(false);
  }
}, [teacherQuestion, currentContent, updateUser, user, showError]);

const handleGenerateLesson = useCallback(async () => {
  console.log('🎯 handleGenerateLesson - Gerando nova lição com IA');
  if (!currentContent) return;

  setLoadingContent(true);
  try {
    const lessonData = {
      topic: 'Próximo tópico recomendado',
      subject_area: currentContent.context?.area || 'Geral',
      knowledge_level: currentContent.context?.level || 'iniciante',
      teaching_style: user.learning_style || 'didático',
      duration_minutes: 30
    };

    console.log('🎯 Dados para gerar lição:', lessonData);

    const response = await llmAPI.generateLesson(lessonData);

    setCurrentContent({
      ...currentContent,
      title: response.lesson_content.title,
      content: response.lesson_content.introduction + '\n\n' + 
              response.lesson_content.main_content.map(section => 
                `## ${section.subtitle}\n${section.content}`
              ).join('\n\n'),
      content_type: 'lesson'
    });

    showSuccess('Nova lição gerada com IA!');     
    updateUser({
      profile_xp: (user.profile_xp || 0) + response.xp_earned
    });

  } catch (error) {
    console.error('❌ Erro ao gerar lição:', error);
    showError('Erro ao gerar lição: ' + error.message);
  } finally {
    setLoadingContent(false);
  }
}, [currentContent, user, updateUser, showError, showSuccess]);

const handleChooseSpecialization = useCallback(async (specialization) => {
  console.log('🎓 handleChooseSpecialization - Escolhendo especialização:', specialization);
  
  if (isNavigating) return;
  
  try {
    setShowSpecializationChoice(false);
    setLoadingContent(true);
    setLocalIsNavigating(true);
    
    // Iniciar a especialização
    await progressAPI.startSpecialization({
      spec_name: specialization.name,
      area: progressInfo.area,
      subarea: progressInfo.subarea
    });
    
    // Navegar para o primeiro módulo da especialização
    if (specialization.modules && specialization.modules.length > 0) {
      const navigationData = {
        area: progressInfo.area,
        subarea: progressInfo.subarea,
        level: 'especialização',
        specialization: specialization.name,
        module_index: 0,
        lesson_index: 0,
        step_index: 0
      };
      
      await navigateAndUpdateProgress(navigationData);
      await loadCurrentContent();
      
      showSuccess(`Iniciando especialização: ${specialization.name}!`);
    }
  } catch (error) {
    console.error('❌ Erro ao iniciar especialização:', error);
    showError('Erro ao iniciar especialização: ' + error.message);
  } finally {
    setLoadingContent(false);
    setLocalIsNavigating(false);
  }
}, [progressInfo, isNavigating, navigateAndUpdateProgress, loadCurrentContent, showError, showSuccess]);

// Componentes Memoizados
const CourseStructureView = React.memo(({ moduleData, currentProgress, onNavigate }) => {
  console.log('🏗️ CourseStructureView - Renderizando estrutura do curso');
  if (!moduleData?.modules) return null;

  const currentLevel = currentProgress?.level || 'iniciante';

  return (
      <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-3">Estrutura do Curso - Nível {currentLevel}</h3>
          
        {moduleData.modules.map((module, moduleIdx) => {
          
        const isCurrentModule = moduleIdx === currentProgress?.module_index;
        const isCompleted = moduleIdx < currentProgress?.module_index;
        const isLocked = moduleIdx > currentProgress?.module_index;

        return (
          <div key={moduleIdx} className={`border rounded-lg ${
            isCurrentModule ? 'border-primary-500 bg-primary-50' : 
            isCompleted ? 'border-green-500 bg-green-50' :
            isLocked ? 'border-gray-300 bg-gray-50 opacity-60' : ''
          }`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center space-x-2">
                  {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {isCurrentModule && <PlayCircle className="h-5 w-5 text-primary-600" />}
                  {isLocked && <Lock className="h-5 w-5 text-gray-400" />}
                  <span>Módulo {moduleIdx + 1}: {module.module_title}</span>
                </h4>
                {isCurrentModule && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                    Atual
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">{module.module_description}</p>

              <div className="space-y-2 mt-3">
                {module.lessons?.map((lesson, lessonIdx) => {
                  const isCurrentLesson = isCurrentModule && lessonIdx === currentProgress?.lesson_index;
                  const isCompletedLesson = isCompleted || (isCurrentModule && lessonIdx < currentProgress?.lesson_index);

                  return (
                    <div key={lessonIdx} className={`flex items-center space-x-2 text-sm p-2 rounded ${
                      isCurrentLesson ? 'bg-primary-100' :
                      isCompletedLesson ? 'bg-green-100' : ''
                    }`}>
                      {isCompletedLesson && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {isCurrentLesson && <PlayCircle className="h-4 w-4 text-primary-600" />}
                      {!isCompletedLesson && !isCurrentLesson && <Circle className="h-4 w-4 text-gray-400" />}
                      
                      <span className={isLocked ? 'text-gray-500' : ''}>
                        Lição {lessonIdx + 1}: {lesson.lesson_title}
                      </span>

                      {isCurrentLesson && currentProgress?.step_index !== undefined && (
                        <span className="text-xs text-primary-600 ml-auto">
                          Passo {currentProgress.step_index + 1}/{lesson.steps?.length || 4}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isLocked && (
                  <div className="mt-3 flex justify-end">
                      <Button
                          size="sm"
                          variant={isCurrentModule ? 'primary' : 'outline'}
                          onClick={() => onNavigate(moduleIdx, 0)}
                          disabled={isNavigating}
                      >
                          {isCurrentModule ? 'Continuar' : 'Revisar'}
                      </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.moduleData === nextProps.moduleData &&
    prevProps.currentProgress?.module_index === nextProps.currentProgress?.module_index &&
    prevProps.currentProgress?.lesson_index === nextProps.currentProgress?.lesson_index &&
    prevProps.currentProgress?.step_index === nextProps.currentProgress?.step_index
  );
});

const SpecializationChoiceModal = React.memo(() => {
  console.log('🎓 SpecializationChoiceModal - Renderizando modal de especialização');
  if (!showSpecializationChoice) return null;
  
  const eligibleSpecializations = availableSpecializations.filter(spec => 
    spec.meets_prerequisites && !spec.is_completed
  );
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" />
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-8">
          <div className="text-center mb-6">
            <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Parabéns! Você completou todos os níveis! 🎉
            </h2>
            <p className="text-lg text-gray-600">
              Escolha uma especialização para continuar sua jornada
            </p>
          </div>
          
          <div className="space-y-4 mb-6">
            {eligibleSpecializations.length > 0 ? (
              eligibleSpecializations.map((spec) => (
                <div key={spec.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                     onClick={() => handleChooseSpecialization(spec)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {spec.name}
                      </h3>
                      <p className="text-gray-600 mb-3">{spec.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Duração:</span>
                          <p className="font-medium">{spec.estimated_time}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Módulos:</span>
                          <p className="font-medium">{spec.modules?.length || 0}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">Habilidades desenvolvidas:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {spec.skills_developed?.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="h-6 w-6 text-gray-400 ml-4" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Nenhuma especialização disponível no momento.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowSpecializationChoice(false)}
                >
                  Voltar
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowSpecializationChoice(false)}
            >
              Decidir depois
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

const AssessmentModal = React.memo(() => {
  console.log('📝 AssessmentModal - Renderizando modal de avaliação');
  if (!showAssessmentModal || !currentAssessment) return null;

  const handleAnswerChange = (questionId, answer) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitAssessment = async () => {
    console.log('📝 submitAssessment - Enviando avaliação');
    try {
      const answers = Object.values(assessmentAnswers);
      const result = await llmAPI.applyAssessment({
        questions: currentAssessment.questions,
        answers: answers
      });

      setAssessmentResult(result);
      
      if (result.passed) {
        await progressAPI.completeAssessment({
          module_title: currentContent?.context?.module,
          level_name: progressInfo?.level,
          score: result.score,
          assessment_type: currentAssessment.type || 'module'
        });
        
        showSuccess(`Avaliação concluída! Pontuação: ${result.score}%`);
        updateUser({
          profile_xp: (user.profile_xp || 0) + result.xp_earned
        });
      }
    } catch (error) {
      console.error('❌ Erro ao processar avaliação:', error);
      showError('Erro ao processar avaliação');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowAssessmentModal(false)} />
        
        <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-4">
            {currentAssessment.title || 'Avaliação'}
          </h2>
          
          {!assessmentResult ? (
            <>
              <div className="space-y-6">
                {currentAssessment.questions.map((question, idx) => (
                  <div key={idx} className="border-b pb-4">
                    <h3 className="font-medium mb-3">
                      {idx + 1}. {question.text}
                    </h3>
                    
                    {question.type === 'múltipla escolha' && (
                      <div className="space-y-2">
                        {question.options.map((option, optIdx) => (
                          <label key={optIdx} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${idx}`}
                              value={optIdx}
                              onChange={() => handleAnswerChange(idx, optIdx)}
                              className="text-primary-600"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'verdadeiro/falso' && (
                      <div className="space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name={`question-${idx}`}
                            value="true"
                            onChange={() => handleAnswerChange(idx, true)}
                            className="mr-2"
                          />
                          Verdadeiro
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name={`question-${idx}`}
                            value="false"
                            onChange={() => handleAnswerChange(idx, false)}
                            className="mr-2"
                          />
                          Falso
                        </label>
                      </div>
                    )}
                    
                    {question.type === 'dissertativa' && (
                      <textarea
                        className="w-full p-3 border rounded-lg"
                        rows="4"
                        placeholder="Digite sua resposta..."
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAssessmentModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitAssessment}
                  disabled={Object.keys(assessmentAnswers).length < currentAssessment.questions.length}
                >
                  Enviar Respostas
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                assessmentResult.passed ? 'bg-success-100' : 'bg-danger-100'
              }`}>
                <span className={`text-3xl font-bold ${
                  assessmentResult.passed ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {assessmentResult.score}%
                </span>
              </div>
              
              <h3 className={`text-xl font-semibold mb-2 ${
                assessmentResult.passed ? 'text-success-700' : 'text-danger-700'
              }`}>
                {assessmentResult.passed ? 'Parabéns! Você passou!' : 'Tente novamente'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                Você acertou {assessmentResult.correct_answers} de {assessmentResult.total_questions} questões
              </p>
              
              <div className="space-y-4 text-left max-w-lg mx-auto">
                {assessmentResult.feedback && assessmentResult.feedback.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${
                    item.correct ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {item.correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="text-sm">
                        <p className="font-medium">Questão {item.question_id + 1}</p>
                        <p className="text-gray-600">{item.feedback}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                className="mt-6"
                onClick={() => {
                  setShowAssessmentModal(false);
                  setAssessmentResult(null);
                  setAssessmentAnswers({});
                }}
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const ProgressTracker = React.memo(({ currentProgress, moduleData }) => {
  console.log('📊 ProgressTracker - Renderizando:', {
    hasProgress: !!currentProgress,
    hasModuleData: !!moduleData,
    isLoadingLevelData: loadingLevelData
  });

  // Se não tem currentProgress, tentar pegar do sessionStorage como fallback
  let progress = currentProgress;
  if (!progress || !progress.area) {
      console.log('⚠️ ProgressTracker - Sem progresso, tentando sessionStorage');
      const savedProgress = sessionStorage.getItem('lastValidProgress');
      if (savedProgress) {
          try {
              progress = JSON.parse(savedProgress);
              console.log('📦 ProgressTracker - Usando progresso do sessionStorage:', progress);
          } catch (e) {
              console.error('❌ ProgressTracker - Erro ao parsear progresso salvo:', e);
          }
      }
  }

  if (!moduleData || !progress || loadingLevelData || !moduleData.modules) {
      return (
          <Card className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <div className="p-4">
                  <div className="mb-3">
                      <h3 className="text-lg font-semibold text-purple-900">
                          📍 Seu Progresso
                      </h3>
                      {progress && progress.area && progress.subarea && (
                          <div className="text-sm text-purple-700 mt-1">
                              <span className="font-medium">{progress.area}</span>
                              <span className="mx-2">›</span>
                              <span className="font-medium">{progress.subarea}</span>
                              <span className="mx-2">›</span>
                              <span className="font-medium capitalize">{progress.level || 'iniciante'}</span>
                          </div>
                      )}
                  </div>
                  <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
              </div>
          </Card>
      );
  }

  const currentModuleIndex = progress.module_index || 0;
  const currentLessonIndex = progress.lesson_index || 0;
  const currentStepIndex = progress.step_index || 0;

  const currentModule = moduleData.modules?.[currentModuleIndex];
  const currentLesson = currentModule?.lessons?.[currentLessonIndex];
  const totalSteps = currentLesson?.steps?.length || 4;

  // Calcular progresso com validação
  const stepProgress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  console.log('📊 ProgressTracker - Dados calculados:', {
      currentModuleIndex,
      currentLessonIndex,
      currentStepIndex,
      totalSteps,
      stepProgress
  });

  return (
      <Card className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="p-4">
              {/* Cabeçalho com contexto completo */}
              <div className="mb-3">
                  <h3 className="text-lg font-semibold text-purple-900">
                      📍 Seu Progresso
                  </h3>
                  <div className="text-sm text-purple-700 mt-1">
                      <span className="font-medium">{progress.area}</span>
                      <span className="mx-2">›</span>
                      <span className="font-medium">{progress.subarea}</span>
                      <span className="mx-2">›</span>
                      <span className="font-medium capitalize">{progress.level}</span>
                  </div>
              </div>
              
              {/* Progresso do Passo */}
              <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                          Passo {currentStepIndex + 1} de {totalSteps}
                      </span>
                      <span className="text-sm font-medium text-purple-700">
                          {Math.round(stepProgress)}%
                      </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stepProgress}%` }}
                      />
                  </div>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div className="text-center">
                      <p className="text-gray-500">Lição</p>
                      <p className="font-semibold text-purple-700">
                          {currentLessonIndex + 1}/{currentModule?.lessons?.length || 0}
                      </p>
                  </div>
                  <div className="text-center">
                      <p className="text-gray-500">Módulo</p>
                      <p className="font-semibold text-purple-700">
                          {currentModuleIndex + 1}/{moduleData.modules?.length || 0}
                      </p>
                  </div>
                  <div className="text-center">
                      <p className="text-gray-500">Nível</p>
                      <p className="font-semibold text-purple-700 capitalize">
                          {progress.level}
                      </p>
                  </div>
              </div>
          </div>
      </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.currentProgress?.module_index === nextProps.currentProgress?.module_index &&
    prevProps.currentProgress?.lesson_index === nextProps.currentProgress?.lesson_index &&
    prevProps.currentProgress?.step_index === nextProps.currentProgress?.step_index &&
    prevProps.currentProgress?.level === nextProps.currentProgress?.level &&
    prevProps.moduleData === nextProps.moduleData &&
    prevProps.loadingLevelData === nextProps.loadingLevelData
  );
});

const SpecializationsView = React.memo(({ specializations, onStartSpecialization }) => {
  console.log('🌟 SpecializationsView - Renderizando especializações:', specializations?.length);
  if (!specializations || specializations.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma especialização disponível
        </h3>
        <p className="text-gray-600">
          Complete mais conteúdo para desbloquear especializações
        </p>
      </div>
    );
  }
  const completedLevels = user?.completed_levels || [];

  const enhancedSpecializations = specializations.map(spec => {
    const meetsPrereqs = spec.prerequisites?.every(prereq => {
      // Verificar se o pré-requisito foi completado
      return completedLevels.some(completed => {
        if (prereq.includes('avançado')) {
          return completed.level === 'avançado' && 
                 completed.area === progressInfo?.area &&
                 completed.subarea === progressInfo?.subarea;
        }
        return false;
      });
    }) ?? true;
    
    return {
      ...spec,
      meets_prerequisites: meetsPrereqs
    };
  });

  return (
    <div className="space-y-4">
      {enhancedSpecializations.map((spec) => (
        <div key={spec.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {spec.name}
                </h3>
                {spec.is_completed && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Concluída
                  </span>
                )}
                {spec.is_started && !spec.is_completed && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                    Em progresso
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-4">{spec.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-sm">
                  <span className="text-gray-500">Duração estimada:</span>
                  <p className="font-medium">{spec.estimated_time}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Faixa etária:</span>
                  <p className="font-medium">{spec.age_range}</p>
                </div>
              </div>

              {spec.prerequisites && spec.prerequisites.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Pré-requisitos:
                  </h4>
                  <div className="flex items-center space-x-2">
                    {spec.meets_prerequisites ? (
                      <Unlock className="h-4 w-4 text-success-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-danger-600" />
                    )}
                    <span className={`text-sm ${
                      spec.meets_prerequisites ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {spec.prerequisites.join(', ')}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Habilidades desenvolvidas:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {spec.skills_developed && spec.skills_developed.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {spec.skills_developed && spec.skills_developed.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{spec.skills_developed.length - 5} mais
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">{spec.modules?.length || 0} módulos</span>
                {spec.final_project && <span> • Inclui projeto final</span>}
              </div>
            </div>

            <div className="ml-6">
              <Button
                size="sm"
                disabled={!spec.meets_prerequisites || spec.is_completed || isNavigating}
                onClick={() => onStartSpecialization(spec)}
                leftIcon={spec.is_started ? <PlayCircle className="h-4 w-4" /> : <Star className="h-4 w-4" />}
              >
                {spec.is_completed ? 'Concluída' : 
                 spec.is_started ? 'Continuar' : 
                 'Iniciar'}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

const ContentAnalysisTools = React.memo(() => {
  console.log('🔧 ContentAnalysisTools - Renderizando ferramentas de análise');
  const [loadingType, setLoadingType] = useState(null);
  const showTools = showToolsState;
  const setShowTools = setShowToolsState;
  const enrichedData = enrichedDataState;
  const setEnrichedData = setEnrichedDataState;
  const activeTab = activeTabState;
  const setActiveTab = setActiveTabState;

  const handleEnrichContent = async (type) => {
    console.log(`🎯 handleEnrichContent chamado para: ${type}`);
    
    if (!currentContent?.content) {
      showError('Nenhum conteúdo disponível para enriquecer');
      return;
    }

    // Se já tem conteúdo, apenas mostrar
    if (enrichedData[type]) {
      console.log(`✅ Conteúdo ${type} já existe, mostrando`);
      setActiveTab(type);
      return;
    }

    setLoadingType(type);

    try {
      const response = await llmAPI.enrichContent({
        content: currentContent.content.substring(0, 2000),
        enrichment_type: type,
        context: {
          title: currentContent.title || "Conteúdo de Aprendizado",
          area: progressInfo?.area || user?.current_track || 'Geral',
          subarea: progressInfo?.subarea || user?.current_subarea || 'Geral',
          level: progressInfo?.level || 'iniciante'
        },
        user_context: {
          age: user?.age || 14,
          learning_style: user?.learning_style || "didático"
        }
      });
      
      console.log('📥 Resposta:', response);

      if (response.enriched_content) {
        // Atualizar estado do pai
        setEnrichedData(prev => ({
          ...prev,
          [type]: response.enriched_content
        }));
        
        // Ativar tab imediatamente
        setActiveTab(type);
        
        showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} gerado!`);
        
        if (response.xp_earned) {
          updateUser({
            profile_xp: (user.profile_xp || 0) + response.xp_earned
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      showError(`Erro ao gerar ${type}`);
    } finally {
      setLoadingType(null);
    }
  };

  const typeInfo = {
    exemplos: { label: 'Exemplos Práticos', icon: BookOpen },
    analogias: { label: 'Analogias', icon: Lightbulb },
    perguntas: { label: 'Perguntas para Reflexão', icon: MessageCircle },
    aplicacoes: { label: 'Aplicações no Mundo Real', icon: Target }
  };

  console.log('🔍 Render - activeTab:', activeTab, 'enrichedData:', Object.keys(enrichedData).filter(k => enrichedData[k]));

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700">
          Ferramentas de Conteúdo
        </h4>
        
        <button
          onClick={() => setShowTools(!showTools)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
            showTools 
              ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span>{showTools ? 'Ocultar' : 'Ferramentas'}</span>
        </button>
      </div>

      {showTools && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-green-600 mb-3 flex items-center">
              <span className="mr-2">✨</span>
              Enriqueça o conteúdo com elementos adicionais:
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(typeInfo).map(([type, info]) => {
                const Icon = info.icon;
                const hasContent = !!enrichedData[type];
                const isLoading = loadingType === type;
                const isActive = activeTab === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => handleEnrichContent(type)}
                    disabled={isLoading || (loadingType !== null && loadingType !== type)}
                    className={`
                      relative px-3 py-2 text-sm font-medium rounded-lg
                      transition-all duration-200 flex items-center justify-center space-x-2
                      ${isActive 
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                        : hasContent
                          ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                      }
                      ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
                      ${loadingType !== null && loadingType !== type ? 'opacity-50' : ''}
                    `}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Icon className="h-4 w-4" />
                        <span>{hasContent ? '✓' : '+'} {info.label}</span>
                      </>
                    )}
                    
                    {hasContent && !isActive && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo enriquecido */}
          {activeTab && enrichedData[activeTab] && (
            <div className="bg-white border rounded-lg overflow-hidden animate-fadeIn">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
                <h5 className="font-medium text-gray-800 flex items-center">
                  {React.createElement(typeInfo[activeTab].icon, { className: "h-4 w-4 mr-2" })}
                  {typeInfo[activeTab].label}
                </h5>
                <button
                  onClick={() => setActiveTab(null)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-4 prose prose-sm max-w-none">
                <ReactMarkdown>{enrichedData[activeTab]}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Navegação rápida */}
          {Object.values(enrichedData).some(Boolean) && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">Conteúdos gerados:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(enrichedData).map(([type, content]) => {
                  if (!content) return null;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveTab(activeTab === type ? null : type)}
                      className={`
                        px-3 py-1 text-xs font-medium rounded-full transition-all
                        ${activeTab === type 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {typeInfo[type].label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const ContentNavigation = React.memo(() => {
  console.log('🧭 ContentNavigation - Renderizando navegação de conteúdo');
  if (!subareaDetails && !loadingStructure) return null;

  return (
    <Card className="mb-6">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title>Navegação do Curso</Card.Title>
            <Card.Subtitle>
              {progressInfo?.area || 'Carregando...'} - {progressInfo?.subarea || 'Carregando...'}
            </Card.Subtitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'current' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('current')}
              leftIcon={<PlayCircle className="h-4 w-4" />}
            >
              Aula Atual
            </Button>
            <Button
              variant={viewMode === 'browse' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('browse')}
              leftIcon={<Grid className="h-4 w-4" />}
            >
              Explorar
            </Button>
            <Button
              variant={viewMode === 'specializations' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('specializations')}
              leftIcon={<Star className="h-4 w-4" />}
            >
              Especializações
            </Button>
          </div>
        </div>
      </Card.Header>

      {loadingStructure ? (
        <div className="p-8 text-center">
          <Loading size="lg" text="Carregando estrutura..." />
        </div>
      ) : (
        <>
          {viewMode === 'browse' && subareaDetails && (
            <div className="space-y-4">
              {subareaDetails.levels.map((level) => {
                const isCurrentLevel = level.name === progressInfo?.level;
                const isExpanded = expandedLevels[level.name];
                const isLocked = level.prerequisites?.some(prereq => 
                  !user?.completed_levels?.some(cl => cl.level === prereq)
                );

                return (
                  <div key={level.name} className={`border rounded-lg ${isLocked ? 'opacity-60' : ''}`}>
                    <button
                      onClick={() => setExpandedLevels(prev => ({
                        ...prev,
                        [level.name]: !prev[level.name]
                      }))}
                      disabled={isLocked}
                      className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        isCurrentLevel ? 'bg-primary-50 border-primary-300' : ''
                      } ${isLocked ? 'cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCurrentLevel ? 'bg-primary-600 text-white' : 
                          isLocked ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {isLocked ? <Lock className="h-5 w-5" /> : 
                           isCurrentLevel ? <PlayCircle className="h-5 w-5" /> : 
                           <BookOpenIcon className="h-5 w-5" />}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">
                            Nível {level.name.charAt(0).toUpperCase() + level.name.slice(1)}
                          </h3>
                          <p className="text-sm text-gray-600">{level.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{level.module_count} módulos</span>
                            {level.has_final_project && <span>• Projeto final</span>}
                            {level.has_final_assessment && <span>• Avaliação final</span>}
                          </div>
                        </div>
                      </div>
                      {!isLocked && (
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      )}
                    </button>

                    {isExpanded && !isLocked && (
                      <div className="p-4 border-t bg-gray-50">
                        <div className="grid gap-3">
                          {Array.from({ length: level.module_count }, (_, idx) => {
                            const isCurrentModule = isCurrentLevel && 
                              progressInfo?.module_index === idx;
                            
                            return (
                              <div key={idx} className={`p-3 bg-white rounded-lg border ${
                                isCurrentModule ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900">
                                        Módulo {idx + 1}
                                      </h4>
                                      {isCurrentModule && (
                                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                          Atual
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Lições teóricas e práticas
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={isCurrentModule ? 'primary' : 'outline'}
                                    onClick={() => navigateToSpecificContent(level.name, idx)}
                                    leftIcon={<PlayCircle className="h-4 w-4" />}
                                    disabled={isNavigating}
                                  >
                                    {isCurrentModule ? 'Continuar' : 'Acessar'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          {level.has_final_project && (
                            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-blue-900">
                                    🎯 Projeto Final do Nível
                                  </h4>
                                  <p className="text-sm text-blue-700 mt-1">
                                    Complete todos os módulos para desbloquear
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="border-blue-300 text-blue-700"
                                >
                                  Bloqueado
                                </Button>
                              </div>
                            </div>
                          )}

                          {level.has_final_assessment && (
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-yellow-900">
                                    📝 Avaliação Final
                                  </h4>
                                  <p className="text-sm text-yellow-700 mt-1">
                                    Teste seus conhecimentos do nível
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateAssessment('final', level.name)}
                                  className="border-yellow-300 text-yellow-700"
                                >
                                  Gerar Avaliação
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        {viewMode === 'browse' && levelData && (
            <Card>
            <Card.Header>
                <Card.Title>Estrutura Completa do Curso</Card.Title>
                <Card.Subtitle>
                    {progressInfo?.area} - {progressInfo?.subarea} - Nível {progressInfo?.level}
                </Card.Subtitle>
            </Card.Header>
            
            <CourseStructureView 
                moduleData={levelData}
                currentProgress={currentProgress}
                onNavigate={(moduleIdx, lessonIdx) => {
                    navigateToSpecificContent(
                        progressInfo?.level || 'iniciante', 
                        moduleIdx, 
                        lessonIdx
                    );
                }}
            />
        </Card>
        )}

        {viewMode === 'specializations' && (
          <SpecializationsView 
            specializations={availableSpecializations}
            onStartSpecialization={handleStartSpecialization}
          />
        )}
      </>
    )}
  </Card>
);
});

// LOG final antes do render
console.log('🎨 LearningPage - Renderização final:', {
  isLoadingContent: loadingContent,
  hasCurrentContent: !!currentContent,
  hasCurrentProgress: progressInfo?.isComplete,
  viewMode
});

if (loadingContent && !currentContent) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" text="Carregando conteúdo..." />
    </div>
  );
}

if (!currentContent) {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Nenhum conteúdo disponível
        </h2>
        <p className="text-gray-600 mb-6">
          Complete o mapeamento de interesses para começar sua jornada de aprendizado
        </p>
        <div className="space-x-4">
          <Button onClick={() => onNavigate?.('mapping')}>
            Fazer Mapeamento
          </Button>
          <Button variant="outline" onClick={handleGenerateLesson}>
            Gerar Lição com IA
          </Button>
        </div>
      </Card>
    </div>
  );
}

return (
  <div className="max-w-6xl mx-auto">
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Conteúdo Principal com Navegação */}
      <div className="lg:col-span-3">
        <ContentNavigation />
        
        {/* Card do conteúdo principal */}
        {viewMode === 'current' && (
          <>
            {/* Progress Tracker mostrando onde estamos */}
            <ProgressTracker 
              currentProgress={currentProgress} 
              moduleData={levelData}
            />
            
            <Card>
              {/* Header do Conteúdo */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentContent.title}
                    </h1>
                    {progressInfo?.isComplete && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <span>{progressInfo.area}</span>
                        <span className="text-gray-400">›</span>
                        <span>{progressInfo.subarea}</span>
                        <span className="text-gray-400">›</span>
                        <span className="capitalize">{progressInfo.level}</span>
                        {currentContent.context?.step && (
                          <>
                            <span className="text-gray-400">›</span>
                            <span>Passo {currentContent.context.step}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTeacherChat(!showTeacherChat)}
                      leftIcon={<MessageCircle className="h-4 w-4" />}
                    >
                      Professor
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateLesson}
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                    >
                      Nova Lição IA
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progresso */}
              {progressInfo?.isComplete && currentProgress && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progresso no Nível
                    </span>
                    <span className="text-sm text-gray-500">
                      {currentProgress.progress_percentage !== undefined && !isNaN(currentProgress.progress_percentage) 
                        ? Math.round(currentProgress.progress_percentage) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${currentProgress.progress_percentage !== undefined && !isNaN(currentProgress.progress_percentage) 
                          ? currentProgress.progress_percentage 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Conteúdo da Lição */}
              <div className="prose prose-sm max-w-none mb-8">
                {currentContent.content_type === 'step' ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {currentContent.context?.lesson}
                    </h3>
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="h-5 w-5 text-primary-600" />
                        <span className="font-medium text-primary-900">
                          Passo {currentContent.context?.step}
                        </span>
                      </div>
                      <p className="text-primary-800 text-sm">
                        {currentContent.original_step}
                      </p>
                    </div>
                    <div className="text-gray-700 leading-relaxed">
                      <ReactMarkdown>{convertLatexToReadable(currentContent.content)}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed">
                    <ReactMarkdown>{convertLatexToReadable(currentContent.content)}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Ferramentas de Análise e Feedback */}
              {currentContent && (
                <>
                  <ContentAnalysisTools />
                  <FeedbackWidget />
                </>
              )}

              {/* Actions unificadas */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {currentContent.navigation?.has_previous && (
                    <Button
                      variant="outline"
                      onClick={handlePreviousContent}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                      disabled={isNavigating}
                    >
                      Anterior
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleCompleteAndAdvance}
                    loading={completingLesson}
                    disabled={!progressInfo?.isComplete || isNavigating}
                    rightIcon={(() => {
                      if (!currentProgress) return <ArrowRight className="h-4 w-4" />;
                      
                      const currentStep = currentProgress.step_index || 0;
                      const currentModuleData = levelData?.modules?.[currentProgress.module_index || 0];
                      const currentLessonData = currentModuleData?.lessons?.[currentProgress.lesson_index || 0];
                      const totalSteps = currentLessonData?.steps?.length || 4;
                      
                      // Se é lição sem passos
                      if (currentContent?.content_type === 'lesson') {
                        return <CheckCircle className="h-4 w-4" />;
                      }
                      
                      // Se é um passo e não é o último
                      if (currentContent?.content_type === 'step' && currentStep < totalSteps - 1) {
                        return <ArrowRight className="h-4 w-4" />;
                      }
                      
                      return <CheckCircle className="h-4 w-4" />;
                    })()}
                  >
                    {(() => {
                      if (completingLesson) return 'Processando...';
                      if (!progressInfo?.isComplete) return 'Carregando...';
                      
                      const currentStep = currentProgress.step_index || 0;
                      const currentModuleData = levelData?.modules?.[currentProgress.module_index || 0];
                      const currentLessonData = currentModuleData?.lessons?.[currentProgress.lesson_index || 0];
                      const totalSteps = currentLessonData?.steps?.length || 4;
                      
                      // Se é lição sem passos
                      if (currentContent?.content_type === 'lesson') {
                        return 'Completar Lição';
                      }
                      
                      // Se é um passo e não é o último
                      if (currentContent?.content_type === 'step' && currentStep < totalSteps - 1) {
                        return `Ir para Passo ${currentStep + 2}`;
                      }
                      
                      // Se é o último passo da lição
                      if (currentContent?.content_type === 'step' && currentStep === totalSteps - 1) {
                        return 'Completar Lição';
                      }
                      
                      // Para outros tipos de conteúdo
                      return 'Continuar';
                    })()}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Objetivos da Lição */}
        {currentContent?.objectives && (
          <Card>
            <Card.Header>
              <Card.Title>Objetivos</Card.Title>
            </Card.Header>
            <div className="space-y-2">
              {currentContent.objectives.split('\n').map((objective, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{objective}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Chat com Professor */}
        {showTeacherChat && (
          <Card>
            <Card.Header>
              <Card.Title>Professor Virtual</Card.Title>
              <Card.Subtitle>Tire suas dúvidas</Card.Subtitle>
            </Card.Header>

            {teacherResponse && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <ReactMarkdown>{teacherResponse}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <textarea
                value={teacherQuestion}
                onChange={(e) => setTeacherQuestion(e.target.value)}
                placeholder="Digite sua pergunta sobre o conteúdo..."
                className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
              />
              
              <Button
                fullWidth
                onClick={handleAskTeacher}
                loading={loadingTeacher}
                disabled={!teacherQuestion.trim()}
                rightIcon={<Send className="h-4 w-4" />}
              >
                {loadingTeacher ? 'Perguntando...' : 'Perguntar'}
              </Button>
            </div>
          </Card>
        )}

        {/* Progresso Detalhado */}
        <Card>
          <Card.Header>
            <Card.Title>Seu Progresso</Card.Title>
          </Card.Header>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nível Atual</span>
              <span className="font-semibold text-secondary-600">
                {user?.profile_level || 1}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Badges</span>
              <span className="font-semibold text-warning-600">
                {user?.total_badges || 0}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('achievements')}
                rightIcon={<Award className="h-4 w-4" />}
              >
                Ver Conquistas
              </Button>
            </div>
          </div>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <Card.Header>
            <Card.Title>Ações Rápidas</Card.Title>
          </Card.Header>

          <div className="space-y-2">
            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => handleGenerateAssessment()}
              leftIcon={<CheckCircle className="h-4 w-4" />}
            >
              Gerar Avaliação
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => onNavigate?.('projects')}
              leftIcon={<Play className="h-4 w-4" />}
            >
              Meus Projetos
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => onNavigate?.('resources')}
              leftIcon={<BookOpen className="h-4 w-4" />}
            >
              Recursos Extras
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => onNavigate?.('dashboard')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>

    {/* Modais */}
    <AssessmentModal />
    <SpecializationChoiceModal />
  </div>
);
};

export default LearningPage;