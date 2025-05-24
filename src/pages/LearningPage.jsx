import React, { useState, useEffect } from 'react';
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
  Grid, 
  List, 
  Lock,
  Clock,
  Unlock, 
  PlayCircle, 
  CheckCircle2, 
  BookOpen as BookOpenIcon,
  X,
  Target
} from 'lucide-react';
import api, { progressAPI, llmAPI, contentAPI, resourcesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const LearningPage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { completeLesson, currentProgress, loadProgress } = useApp();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [currentContent, setCurrentContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showTeacherChat, setShowTeacherChat] = useState(false);
  const [teacherQuestion, setTeacherQuestion] = useState('');
  const [teacherResponse, setTeacherResponse] = useState('');
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);

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
    difficulty: 3,
    clarity: 3,
    engagement: 3,
    relevance: 3
  });
  const [suggestions, setSuggestions] = useState('');
  const [missingTopics, setMissingTopics] = useState('');

  // Carregar conteúdo atual
  useEffect(() => {
    loadCurrentContent();
  }, []);

  // Carregar estrutura completa da subárea
  useEffect(() => {
    if (currentProgress?.area && currentProgress?.subarea) {
      loadSubareaStructure();
      loadSpecializations();
    }
  }, [currentProgress?.area, currentProgress?.subarea]);

  const loadCurrentContent = async () => {
    setLoadingContent(true);
    try {
      const content = await progressAPI.getCurrentContent();
      setCurrentContent(content);
    } catch (error) {
      showError('Erro ao carregar conteúdo: ' + error.message);
    } finally {
      setLoadingContent(false);
    }
  };

  const loadSubareaStructure = async () => {
    if (!currentProgress?.area || !currentProgress?.subarea) return;
    
    setLoadingStructure(true);
    try {
      const response = await api.get(`/content/areas/${currentProgress.area}/subareas/${currentProgress.subarea}`);
      setSubareaDetails(response.data);
    } catch (error) {
      console.error('Erro ao carregar estrutura:', error);
      try {
        const details = await contentAPI.getSubareaDetails(
          currentProgress?.area,
          currentProgress?.subarea
        );
        setSubareaDetails(details);
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    } finally {
      setLoadingStructure(false);
    }
  };

  const loadSpecializations = async () => {
    if (!currentProgress?.area || !currentProgress?.subarea) return;
    
    try {
      const specs = await resourcesAPI.getSpecializations(
        currentProgress.area, 
        currentProgress.subarea
      );
      setAvailableSpecializations(specs);
    } catch (error) {
      console.error('Erro ao carregar especializações:', error);
    }
  };

  // Navegar para conteúdo específico
  const navigateToSpecificContent = async (level, moduleIndex, lessonIndex = 0) => {
    try {
      setLoadingContent(true);
      
      try {
        await api.post('/progress/navigate-to', {
          area: currentProgress.area,
          subarea: currentProgress.subarea,
          level: level,
          module_index: moduleIndex,
          lesson_index: lessonIndex,
          step_index: 0
        });
      } catch (apiError) {
        const updateData = {
          area: currentProgress?.area,
          subarea: currentProgress?.subarea,
          level: level,
          module_index: moduleIndex,
          lesson_index: lessonIndex,
          step_index: 0
        };
        
        await progressAPI.updateCurrentPosition(updateData);
      }
      
      await loadCurrentContent();
      await loadProgress(true);
      
      setViewMode('current');
      showSuccess('Navegação atualizada!');
    } catch (error) {
      showError('Erro ao navegar: ' + error.message);
    } finally {
      setLoadingContent(false);
    }
  };

  // Gerar avaliação
  const handleGenerateAssessment = async (type = 'module', level = null) => {
    try {
      const assessmentData = {
        topic: type === 'final' 
          ? `${currentProgress?.area} - ${currentProgress?.subarea} - Nível ${level}` 
          : currentContent?.title || 'Conceitos do módulo atual',
        difficulty: level || currentProgress?.level || 'iniciante',
        num_questions: type === 'final' ? 15 : 10,
        question_types: ['múltipla escolha', 'verdadeiro/falso', 'dissertativa']
      };
      
      const response = await llmAPI.generateAssessment(assessmentData);
      setCurrentAssessment({
        ...response.assessment,
        type: type
      });
      setShowAssessmentModal(true);
    } catch (error) {
      showError('Erro ao gerar avaliação: ' + error.message);
    }
  };

  // Iniciar especialização
  const handleStartSpecialization = async (specialization) => {
    try {
      await api.post('/progress/specialization/start', {
        spec_name: specialization.name,
        area: currentProgress.area,
        subarea: currentProgress.subarea
      });
      
      showSuccess(`Especialização "${specialization.name}" iniciada!`);
      await loadSpecializations();
      
      if (specialization.modules && specialization.modules.length > 0) {
        setViewMode('current');
      }
    } catch (error) {
      showError('Erro ao iniciar especialização: ' + error.message);
    }
  };

  // Analisar conteúdo
  const analyzeContent = async () => {
    setLoadingAnalysis(true);
    try {
      const analysis = await llmAPI.analyzeContent(currentContent.content);
      
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
      showError('Erro ao analisar conteúdo');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Enriquecer conteúdo
  const enrichContent = async (type) => {
    setLoadingAnalysis(true);
    try {
      const enriched = await llmAPI.enrichContent(currentContent.content, type);
      setEnrichedContent({
        type: type,
        content: enriched.enriched_content
      });
    } catch (error) {
      showError('Erro ao enriquecer conteúdo');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Enviar feedback
  const submitFeedback = async () => {
    try {
      const feedbackData = {
        session_type: 'study',
        content_id: currentContent?.id || 'current',
        content_type: currentContent?.content_type,
        ratings: feedbackRatings,
        missing_topics: missingTopics.split(',').filter(t => t.trim()),
        suggestions: suggestions
      };
      
      await api.post('/feedback/collect', feedbackData);
      
      showSuccess('Obrigado pelo seu feedback!');
      setShowFeedback(false);
      
      const adaptResult = await api.post('/feedback/adapt');
      if (adaptResult.data.adapted) {
        showInfo('Suas preferências foram atualizadas!');
      }
    } catch (error) {
      showError('Erro ao enviar feedback');
    }
  };

  // Completar lição atual
  const handleCompleteLesson = async () => {
    if (!currentContent) return;

    setCompletingLesson(true);
    try {
      const result = await completeLesson({
        lesson_title: currentContent.title,
        area_name: currentContent.context?.area,
        subarea_name: currentContent.context?.subarea,
        level_name: currentContent.context?.level,
        module_title: currentContent.context?.module,
        advance_progress: true
      });

      showSuccess(`Lição completada! +${result.xp_earned} XP`);
      
      updateUser({
        profile_xp: (user.profile_xp || 0) + result.xp_earned
      });

      if (result.newBadges && result.newBadges.length > 0) {
        result.newBadges.forEach(badge => {
          showSuccess(`Nova conquista desbloqueada: ${badge}!`);
        });
      }

      await loadCurrentContent();
      await loadProgress(true);

    } catch (error) {
      showError('Erro ao completar lição: ' + error.message);
    } finally {
      setCompletingLesson(false);
    }
  };

  // Avançar progresso manualmente
  const handleAdvanceProgress = async () => {
    try {
      await progressAPI.advanceProgress('lesson');
      await loadCurrentContent();
      await loadProgress(true);
      showSuccess('Progresso avançado!');
    } catch (error) {
      showError('Erro ao avançar progresso: ' + error.message);
    }
  };

  // Perguntar ao professor
  const handleAskTeacher = async () => {
    if (!teacherQuestion.trim()) return;

    setLoadingTeacher(true);
    try {
      const response = await llmAPI.askTeacher(
        teacherQuestion,
        currentContent ? `Estou estudando: ${currentContent.title}` : ''
      );
      
      setTeacherResponse(response.answer);
      setTeacherQuestion('');
      
      updateUser({
        profile_xp: (user.profile_xp || 0) + response.xp_earned
      });

    } catch (error) {
      showError('Erro ao perguntar ao professor: ' + error.message);
    } finally {
      setLoadingTeacher(false);
    }
  };

  // Gerar nova lição
  const handleGenerateLesson = async () => {
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
      showError('Erro ao gerar lição: ' + error.message);
    } finally {
      setLoadingContent(false);
    }
  };

  // Componente de Modal de Avaliação
  const AssessmentModal = () => {
    if (!showAssessmentModal || !currentAssessment) return null;

    const handleAnswerChange = (questionId, answer) => {
      setAssessmentAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    };

    const submitAssessment = async () => {
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
            level_name: currentProgress?.level,
            score: result.score,
            assessment_type: currentAssessment.type || 'module'
          });
          
          showSuccess(`Avaliação concluída! Pontuação: ${result.score}%`);
          updateUser({
            profile_xp: (user.profile_xp || 0) + result.xp_earned
          });
        }
      } catch (error) {
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
  };

  // Componente de Especializações
  const SpecializationsView = ({ specializations, onStartSpecialization }) => {
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

    return (
      <div className="space-y-4">
        {specializations.map((spec) => (
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
                  disabled={!spec.meets_prerequisites || spec.is_completed}
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
  };

  // Componente de Análise de Conteúdo
  const ContentAnalysisTools = () => (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">
          Ferramentas de Conteúdo
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeContent}
          loading={loadingAnalysis}
          leftIcon={<Lightbulb className="h-4 w-4" />}
        >
          Analisar Conteúdo
        </Button>
      </div>
      
      {showContentOptions && (
        <div className="mt-4 space-y-3">
          {alternativeContent && (
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-medium text-blue-900">
                    Versão Simplificada Disponível
                  </h5>
                  <p className="text-sm text-blue-700 mt-1">
                    {alternativeContent.reason}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentContent(prev => ({
                    ...prev,
                    content: alternativeContent.content
                  }))}
                >
                  Usar
                </Button>
              </div>
            </Card>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => enrichContent('exemplos')}
              leftIcon={<BookOpen className="h-4 w-4" />}
            >
              + Exemplos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => enrichContent('analogias')}
              leftIcon={<Lightbulb className="h-4 w-4" />}
            >
              + Analogias
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => enrichContent('perguntas')}
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              + Perguntas
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => enrichContent('aplicações')}
              leftIcon={<Target className="h-4 w-4" />}
            >
              + Aplicações
            </Button>
          </div>
          
          {enrichedContent && (
            <Card className="bg-green-50 border-green-200">
              <h5 className="font-medium text-green-900 mb-2">
                Conteúdo Enriquecido com {enrichedContent.type}
              </h5>
              <div className="prose prose-sm max-w-none text-green-800">
                {enrichedContent.content}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setCurrentContent(prev => ({
                  ...prev,
                  content: prev.content + '\n\n' + enrichedContent.content
                }))}
              >
                Adicionar ao Conteúdo
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // Componente de Feedback
  const FeedbackWidget = () => (
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
              difficulty: 'Dificuldade',
              clarity: 'Clareza',
              engagement: 'Engajamento',
              relevance: 'Relevância'
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

  // Componente de navegação melhorado
  const ContentNavigation = () => {
    if (!subareaDetails && !loadingStructure) return null;

    return (
      <Card className="mb-6">
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>Navegação do Curso</Card.Title>
              <Card.Subtitle>
                {currentProgress?.area} - {currentProgress?.subarea}
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
                  const isCurrentLevel = level.name === currentProgress?.level;
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
                                currentProgress?.module_index === idx;
                              
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
  };

  if (loadingContent) {
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
            <Card>
              {/* Header do Conteúdo */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentContent.title}
                    </h1>
                    {currentContent.context && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{currentContent.context.area}</span>
                        <span>•</span>
                        <span>{currentContent.context.subarea}</span>
                        <span>•</span>
                        <span className="capitalize">{currentContent.context.level}</span>
                        {currentContent.context.step && (
                          <>
                            <span>•</span>
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
              {currentProgress && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progresso no Nível
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(currentProgress.progress_percentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentProgress.progress_percentage}%` }}
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
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {currentContent.content}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {currentContent.content}
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

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {currentContent.navigation?.has_previous && (
                    <Button
                      variant="outline"
                      onClick={handleAdvanceProgress}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Anterior
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleCompleteLesson}
                    loading={completingLesson}
                    rightIcon={<CheckCircle className="h-4 w-4" />}
                  >
                    {completingLesson ? 'Completando...' : 'Completar Lição'}
                  </Button>
                  
                  {currentContent.navigation?.has_next && (
                    <Button
                      onClick={handleAdvanceProgress}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Próximo
                    </Button>
                  )}
                </div>
              </div>
            </Card>
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
                      {teacherResponse}
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
    </div>
  );
};

export default LearningPage;