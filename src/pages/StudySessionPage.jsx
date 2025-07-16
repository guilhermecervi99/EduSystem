// StudySessionPage.jsx - VERSÃO CORRIGIDA SEM REACT-ROUTER-DOM
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
  RotateCcw
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const StudySessionPage = ({ onNavigate, navigationState }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Estados
  const [session, setSession] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentActivity, setCurrentActivity] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedActivities, setCompletedActivities] = useState(new Set());
  const [sessionNotes, setSessionNotes] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  
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
    
    // Avançar para próxima atividade se houver
    const phase = session.structure[currentPhase];
    if (activityIndex < phase.activities.length - 1) {
      setCurrentActivity(activityIndex + 1);
    }
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
    } catch (error) {
      console.error('Erro ao salvar conclusão:', error);
    }
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
    // Som simples de notificação
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
      default:
        return <AlertCircle className="h-5 w-5" />;
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
        </Card.Header>
        
        {/* Conteúdo da Atividade */}
        <div className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-gray-800">{activity.content}</p>
          </div>
          
          {/* Materiais */}
          {activity.materials && activity.materials.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Materiais</h4>
              <ul className="list-disc list-inside space-y-1">
                {activity.materials.map((material, index) => (
                  <li key={index} className="text-gray-700">{material}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Dicas */}
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
          {isPlaying && !isPaused && (
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
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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