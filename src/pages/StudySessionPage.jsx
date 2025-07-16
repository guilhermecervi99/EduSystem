// StudySessionPage.jsx - VERSÃO FUNCIONAL COM CONTEÚDO REAL
import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  Coffee,
  Target,
  BookOpen,
  Code,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Brain,
  Lightbulb,
  MessageCircle,
  Send,
  X,
  RefreshCw,
  FileText
} from 'lucide-react';
import { analyticsAPI, llmAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import ReactMarkdown from 'react-markdown';

const StudySessionPage = ({ onNavigate, navigationState }) => {
  const { user, updateUser } = useAuth();
  const { currentProgress } = useApp();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Estados principais
  const [session, setSession] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentActivity, setCurrentActivity] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedActivities, setCompletedActivities] = useState(new Set());
  const [sessionNotes, setSessionNotes] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  
  // Estados para conteúdo dinâmico
  const [activityContent, setActivityContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showTeacherChat, setShowTeacherChat] = useState(false);
  const [teacherQuestion, setTeacherQuestion] = useState('');
  const [teacherResponse, setTeacherResponse] = useState('');
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [practiceResults, setPracticeResults] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  
  // Refs
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  // Carregar sessão
  useEffect(() => {
    if (navigationState?.session) {
      setSession(navigationState.session);
      initializeSession(navigationState.session);
    } else if (navigationState?.sessionId) {
      loadSession(navigationState.sessionId);
    } else {
      showError('Nenhuma sessão encontrada');
      onNavigate?.('dashboard');
    }
  }, [navigationState]);
  
  // Timer
  useEffect(() => {
    if (isPlaying && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isPlaying, isPaused, timeRemaining]);
  
  // Carregar conteúdo da atividade quando mudar
  useEffect(() => {
    if (session && !showCompletion) {
      loadActivityContent();
    }
  }, [currentPhase, currentActivity, session]);
  
  // Inicializar sessão
  const initializeSession = (sessionData) => {
    if (sessionData.structure && sessionData.structure.length > 0) {
      const firstPhase = sessionData.structure[0];
      setTimeRemaining(firstPhase.duration_minutes * 60);
    }
  };
  
  // Carregar sessão do backend
  const loadSession = async (sessionId) => {
    try {
      const data = await analyticsAPI.getStudySessionDetails(sessionId);
      setSession(data.session);
      initializeSession(data.session);
    } catch (error) {
      showError('Erro ao carregar sessão');
      onNavigate?.('dashboard');
    }
  };
  
  // Carregar conteúdo real para a atividade
  const loadActivityContent = async () => {
    if (!session || showCompletion) return;
    
    const phase = session.structure[currentPhase];
    const activity = phase.activities[currentActivity];
    
    setLoadingContent(true);
    
    try {
      let content = null;
      
      switch (activity.type) {
        case 'explanation':
        case 'theory':
          // Gerar explicação usando LLM
          content = await generateTheoryContent(activity);
          break;
          
        case 'practice':
        case 'exercise':
          // Gerar exercícios práticos
          content = await generatePracticeContent(activity);
          break;
          
        case 'quiz':
          // Gerar quiz
          content = await generateQuizContent(activity);
          break;
          
        case 'review':
          // Gerar revisão
          content = await generateReviewContent(activity);
          break;
          
        default:
          content = {
            type: 'default',
            content: activity.content || 'Conteúdo não disponível'
          };
      }
      
      setActivityContent(content);
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
      showError('Erro ao gerar conteúdo da atividade');
    } finally {
      setLoadingContent(false);
    }
  };
  
  // Gerar conteúdo teórico
  const generateTheoryContent = async (activity) => {
    const topic = session.topic || activity.title || 'Conceitos gerais';
    
    const response = await llmAPI.generateLesson({
      topic: topic,
      subject_area: currentProgress?.area || user?.current_track || 'Geral',
      knowledge_level: currentProgress?.level || 'iniciante',
      teaching_style: user?.learning_style || 'didático',
      duration_minutes: activity.duration_minutes || 10
    });
    
    return {
      type: 'theory',
      title: response.lesson_content.title,
      introduction: response.lesson_content.introduction,
      mainContent: response.lesson_content.main_content,
      keyPoints: response.lesson_content.key_points || [],
      examples: response.lesson_content.examples || []
    };
  };
  
  // Gerar conteúdo prático
  const generatePracticeContent = async (activity) => {
    const topic = session.topic || activity.title || 'Exercícios práticos';
    
    // Usar a API de assessment para gerar exercícios práticos
    const response = await llmAPI.generateAssessment({
      topic: topic,
      difficulty: currentProgress?.level || 'iniciante',
      num_questions: 3,
      question_types: ['múltipla escolha', 'dissertativa']
    });
    
    return {
      type: 'practice',
      title: `Prática: ${topic}`,
      exercises: response.assessment.questions,
      instructions: activity.content || 'Complete os exercícios a seguir:'
    };
  };
  
  // Gerar quiz
  const generateQuizContent = async (activity) => {
    const topic = session.topic || activity.title || 'Quiz rápido';
    
    const response = await llmAPI.generateAssessment({
      topic: topic,
      difficulty: currentProgress?.level || 'iniciante',
      num_questions: 5,
      question_types: ['múltipla escolha', 'verdadeiro/falso']
    });
    
    return {
      type: 'quiz',
      title: `Quiz: ${topic}`,
      questions: response.assessment.questions,
      passingScore: 60
    };
  };
  
  // Gerar conteúdo de revisão
  const generateReviewContent = async (activity) => {
    const topic = session.topic || 'Conceitos estudados';
    
    // Gerar um resumo dos principais pontos
    const prompt = `Crie um resumo de revisão sobre ${topic} para um estudante de ${user?.age || 14} anos, 
                   incluindo os pontos principais, dicas de memorização e conexões com outros conceitos.`;
    
    const response = await llmAPI.askTeacher(prompt, `Área: ${currentProgress?.area || 'Geral'}`);
    
    return {
      type: 'review',
      title: `Revisão: ${topic}`,
      content: response.answer,
      tips: activity.tips || []
    };
  };
  
  // Formatar tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Controles de tempo
  const handleStart = () => {
    setIsPlaying(true);
    setIsPaused(false);
    showInfo('Sessão iniciada! Mantenha o foco.');
  };
  
  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      showInfo('Sessão pausada. Respire fundo e relaxe.');
    }
  };
  
  const handleReset = () => {
    if (window.confirm('Deseja reiniciar esta fase?')) {
      const phase = session.structure[currentPhase];
      setTimeRemaining(phase.duration_minutes * 60);
      setCurrentActivity(0);
      setIsPaused(false);
      loadActivityContent();
    }
  };
  
  // Navegação
  const handlePhaseComplete = () => {
    playNotificationSound();
    
    // Verificar se há pausas programadas
    const currentTime = getTotalElapsedTime();
    const nextBreak = session.breaks?.find(b => 
      b.after_minutes * 60 === currentTime && !completedActivities.has(`break-${b.after_minutes}`)
    );
    
    if (nextBreak) {
      showBreakModal(nextBreak);
      return;
    }
    
    // Avançar para próxima fase
    if (currentPhase < session.structure.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentActivity(0);
      const nextPhase = session.structure[currentPhase + 1];
      setTimeRemaining(nextPhase.duration_minutes * 60);
      showSuccess(`Fase "${session.structure[currentPhase].phase}" concluída!`);
    } else {
      // Sessão completa
      handleSessionComplete();
    }
  };
  
  const handleActivityComplete = (activityIndex) => {
    const key = `${currentPhase}-${activityIndex}`;
    setCompletedActivities(new Set([...completedActivities, key]));
    
    // Salvar resultados se for prática ou quiz
    if (activityContent?.type === 'practice') {
      const results = calculatePracticeResults();
      setPracticeResults(prev => ({ ...prev, [key]: results }));
    } else if (activityContent?.type === 'quiz') {
      const results = calculateQuizResults();
      setPracticeResults(prev => ({ ...prev, [key]: results }));
    }
    
    // Avançar para próxima atividade se houver
    const phase = session.structure[currentPhase];
    if (activityIndex < phase.activities.length - 1) {
      setCurrentActivity(activityIndex + 1);
      setQuizAnswers({}); // Limpar respostas do quiz
    }
    
    showSuccess('Atividade concluída!');
  };
  
  const calculatePracticeResults = () => {
    // Lógica simplificada para calcular resultados
    return {
      completed: true,
      score: 85,
      feedback: 'Bom trabalho! Continue praticando.'
    };
  };
  
  const calculateQuizResults = () => {
    let correct = 0;
    activityContent.questions.forEach((question, idx) => {
      if (quizAnswers[idx] === question.correct_answer) {
        correct++;
      }
    });
    
    const score = Math.round((correct / activityContent.questions.length) * 100);
    return {
      score,
      correct,
      total: activityContent.questions.length,
      passed: score >= (activityContent.passingScore || 60)
    };
  };
  
  const handleSessionComplete = async () => {
    setIsPlaying(false);
    setShowCompletion(true);
    
    try {
      await analyticsAPI.completeStudySession(navigationState?.sessionId || 'temp', {
        completed_activities: Array.from(completedActivities),
        notes: sessionNotes,
        completion_rate: (completedActivities.size / getTotalActivities()) * 100,
        total_time_minutes: getTotalElapsedTime() / 60
      });
      
      showSuccess('Sessão concluída com sucesso! 🎉');
      
      // Adicionar XP
      const xpEarned = Math.round((completedActivities.size / getTotalActivities()) * 20);
      updateUser({
        profile_xp: (user.profile_xp || 0) + xpEarned
      });
      
    } catch (error) {
      console.error('Erro ao salvar conclusão:', error);
    }
  };
  
  // Professor Virtual
  const handleAskTeacher = async () => {
    if (!teacherQuestion.trim()) return;
    
    setLoadingTeacher(true);
    try {
      const context = `Estou em uma sessão de estudos sobre ${session.topic}. 
                      Atividade atual: ${activityContent?.title || 'Sem título'}`;
      
      const response = await llmAPI.askTeacher(teacherQuestion, context);
      setTeacherResponse(response.answer);
      setTeacherQuestion('');
      
      if (response.xp_earned) {
        updateUser({
          profile_xp: (user.profile_xp || 0) + response.xp_earned
        });
      }
    } catch (error) {
      showError('Erro ao perguntar ao professor');
    } finally {
      setLoadingTeacher(false);
    }
  };
  
  // Regenerar conteúdo
  const handleRegenerateContent = async () => {
    await loadActivityContent();
    showSuccess('Conteúdo regenerado!');
  };
  
  // Utils
  const getTotalElapsedTime = () => {
    let total = 0;
    for (let i = 0; i < currentPhase; i++) {
      total += session.structure[i].duration_minutes * 60;
    }
    const currentPhaseDuration = session.structure[currentPhase].duration_minutes * 60;
    total += currentPhaseDuration - timeRemaining;
    return total;
  };
  
  const getTotalActivities = () => {
    return session.structure.reduce((acc, phase) => 
      acc + phase.activities.length, 0
    );
  };
  
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };
  
  const showBreakModal = (breakInfo) => {
    setIsPaused(true);
    showInfo(
      <div>
        <h3 className="font-semibold mb-2">Hora da Pausa! ☕</h3>
        <p>{breakInfo.suggestion}</p>
        <p className="text-sm mt-2">Duração: {breakInfo.duration} minutos</p>
      </div>
    );
  };
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'theory':
      case 'explanation':
        return <BookOpen className="h-5 w-5" />;
      case 'practice':
      case 'exercise':
        return <Code className="h-5 w-5" />;
      case 'quiz':
        return <Target className="h-5 w-5" />;
      case 'review':
        return <Brain className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  // Renderizar conteúdo da atividade
  const renderActivityContent = () => {
    if (loadingContent) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" text="Gerando conteúdo..." />
        </div>
      );
    }
    
    if (!activityContent) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Nenhum conteúdo disponível</p>
          <Button
            className="mt-4"
            onClick={loadActivityContent}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Gerar Conteúdo
          </Button>
        </div>
      );
    }
    
    switch (activityContent.type) {
      case 'theory':
        return (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {activityContent.title}
              </h3>
              
              {activityContent.introduction && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-blue-800">{activityContent.introduction}</p>
                </div>
              )}
              
              {activityContent.mainContent?.map((section, idx) => (
                <div key={idx} className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {section.subtitle}
                  </h4>
                  <ReactMarkdown className="text-gray-700">
                    {section.content}
                  </ReactMarkdown>
                </div>
              ))}
              
              {activityContent.keyPoints?.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    📌 Pontos Principais
                  </h4>
                  <ul className="space-y-1">
                    {activityContent.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-yellow-800">• {point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'practice':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              {activityContent.title}
            </h3>
            
            <p className="text-gray-600">{activityContent.instructions}</p>
            
            {activityContent.exercises?.map((exercise, idx) => (
              <Card key={idx} className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Exercício {idx + 1}: {exercise.text}
                </h4>
                
                {exercise.type === 'múltipla escolha' ? (
                  <div className="space-y-2">
                    {exercise.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`exercise-${idx}`}
                          className="text-primary-600"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="w-full p-3 border rounded-lg"
                    rows="4"
                    placeholder="Digite sua resposta..."
                  />
                )}
              </Card>
            ))}
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              {activityContent.title}
            </h3>
            
            {activityContent.questions?.map((question, idx) => (
              <Card key={idx} className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {idx + 1}. {question.text}
                </h4>
                
                {question.type === 'múltipla escolha' && (
                  <div className="space-y-2">
                    {question.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`quiz-${idx}`}
                          value={optIdx}
                          onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                          checked={quizAnswers[idx] === optIdx}
                          className="text-primary-600"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {question.type === 'verdadeiro/falso' && (
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`quiz-${idx}`}
                        value="true"
                        onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: true })}
                        checked={quizAnswers[idx] === true}
                      />
                      <span>Verdadeiro</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`quiz-${idx}`}
                        value="false"
                        onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: false })}
                        checked={quizAnswers[idx] === false}
                      />
                      <span>Falso</span>
                    </label>
                  </div>
                )}
              </Card>
            ))}
            
            {Object.keys(quizAnswers).length === activityContent.questions.length && (
              <div className="text-center">
                <Button
                  onClick={() => {
                    const results = calculateQuizResults();
                    showInfo(`Você acertou ${results.correct} de ${results.total} questões!`);
                  }}
                >
                  Verificar Respostas
                </Button>
              </div>
            )}
          </div>
        );
        
      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {activityContent.title}
            </h3>
            
            <div className="prose max-w-none">
              <ReactMarkdown>{activityContent.content}</ReactMarkdown>
            </div>
            
            {activityContent.tips?.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  💡 Dicas de Revisão
                </h4>
                <ul className="space-y-1">
                  {activityContent.tips.map((tip, idx) => (
                    <li key={idx} className="text-green-800">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="prose max-w-none">
            <p className="text-gray-700">{activityContent.content}</p>
          </div>
        );
    }
  };
  
  if (!session) {
    return <Loading text="Carregando sessão de estudos..." />;
  }
  
  const phase = session.structure[currentPhase];
  const activity = phase.activities[currentActivity];
  const totalProgress = ((currentPhase + (currentActivity + 1) / phase.activities.length) / session.structure.length) * 100;
  
  if (showCompletion) {
    const completionRate = (completedActivities.size / getTotalActivities()) * 100;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>Sessão Concluída! 🎉</Card.Title>
            <Card.Subtitle>{session.title}</Card.Subtitle>
          </Card.Header>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-success-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-success-700">
                {Math.round(completionRate)}%
              </div>
              <p className="text-sm text-gray-600">Taxa de Conclusão</p>
            </div>
            
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <Clock className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary-700">
                {Math.round(getTotalElapsedTime() / 60)}min
              </div>
              <p className="text-sm text-gray-600">Tempo Total</p>
            </div>
            
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <Target className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary-700">
                {completedActivities.size}/{getTotalActivities()}
              </div>
              <p className="text-sm text-gray-600">Atividades Completas</p>
            </div>
          </div>
          
          {/* Objetivos alcançados */}
          {session.objectives && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Objetivos Alcançados</h3>
              <div className="space-y-2">
                {session.objectives.map((objective, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                    <span className="text-gray-700">{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Conceitos principais */}
          {session.key_concepts && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Conceitos Estudados</h3>
              <div className="flex flex-wrap gap-2">
                {session.key_concepts.map((concept, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Próximos passos */}
          {session.next_steps && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Próximos Passos</h3>
              <div className="space-y-2">
                {session.next_steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <ChevronRight className="h-5 w-5 text-primary-600 mt-0.5" />
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Notas */}
          {sessionNotes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Suas Anotações</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{sessionNotes}</p>
            </div>
          )}
          
          {/* Ações */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => onNavigate?.('dashboard')}
            >
              Voltar ao Dashboard
            </Button>
            
            <div className="space-x-3">
              <Button
                variant="secondary"
                onClick={() => onNavigate?.('learning')}
              >
                Continuar Estudando
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
              >
                Nova Sessão
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-600">{session.topic}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-xs text-gray-500">Tempo Restante</p>
            </div>
            
            {/* Controles */}
            <div className="flex space-x-2">
              {!isPlaying ? (
                <Button
                  size="sm"
                  onClick={handleStart}
                  leftIcon={<Play className="h-4 w-4" />}
                >
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={isPaused ? "primary" : "secondary"}
                    onClick={handlePause}
                    leftIcon={<Pause className="h-4 w-4" />}
                  >
                    {isPaused ? 'Continuar' : 'Pausar'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReset}
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                  >
                    Reiniciar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progresso Total</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      </Card>
      
      {/* Fase Atual */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <Card.Title>{phase.phase}</Card.Title>
                <Card.Subtitle>
                  Atividade {currentActivity + 1} de {phase.activities.length}
                </Card.Subtitle>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Regenerar conteúdo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateContent}
                disabled={loadingContent}
                title="Regenerar conteúdo"
              >
                <RefreshCw className={`h-4 w-4 ${loadingContent ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Professor Virtual */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTeacherChat(!showTeacherChat)}
                title="Perguntar ao professor"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              
              {/* Indicadores de atividades */}
              <div className="flex space-x-1">
                {phase.activities.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      completedActivities.has(`${currentPhase}-${index}`)
                        ? 'bg-success-500'
                        : index === currentActivity
                        ? 'bg-primary-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card.Header>
        
        {/* Conteúdo da Atividade */}
        <div className="space-y-4">
          {/* Conteúdo Principal */}
          {renderActivityContent()}
          
          {/* Materiais (se houver) */}
          {activity.materials && activity.materials.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">📚 Materiais de Apoio</h4>
              <ul className="list-disc list-inside space-y-1">
                {activity.materials.map((material, index) => (
                  <li key={index} className="text-gray-700">{material}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Dicas (se houver) */}
          {activity.tips && activity.tips.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Dicas</h4>
              <ul className="space-y-1">
                {activity.tips.map((tip, index) => (
                  <li key={index} className="text-blue-800 text-sm">{tip}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Botão de conclusão */}
          {isPlaying && !isPaused && !loadingContent && (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleActivityComplete(currentActivity)}
                disabled={completedActivities.has(`${currentPhase}-${currentActivity}`)}
              >
                {completedActivities.has(`${currentPhase}-${currentActivity}`)
                  ? 'Concluída'
                  : 'Marcar como Concluída'
                }
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Chat com Professor (se visível) */}
      {showTeacherChat && (
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Professor Virtual</Card.Title>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTeacherChat(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card.Header>
          
          {teacherResponse && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
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
              className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none"
              disabled={loadingTeacher}
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
      
      {/* Área de Notas */}
      <Card>
        <Card.Header>
          <Card.Title>Suas Anotações</Card.Title>
          <Card.Subtitle>Registre insights e observações importantes</Card.Subtitle>
        </Card.Header>
        
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Digite suas anotações aqui..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none"
          disabled={!isPlaying}
        />
      </Card>
      
      {/* Audio para notificações */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
        <source src="/notification.ogg" type="audio/ogg" />
      </audio>
    </div>
  );
};

export default StudySessionPage;