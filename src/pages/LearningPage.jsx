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
  RefreshCw
} from 'lucide-react';
import { progressAPI, llmAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const LearningPage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { completeLesson, currentProgress, loadProgress } = useApp();
  const { showSuccess, showError } = useNotification();
  
  const [currentContent, setCurrentContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showTeacherChat, setShowTeacherChat] = useState(false);
  const [teacherQuestion, setTeacherQuestion] = useState('');
  const [teacherResponse, setTeacherResponse] = useState('');
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);

  // Carregar conteúdo atual
  useEffect(() => {
    loadCurrentContent();
  }, []);

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
      
      // Atualizar XP do usuário
      updateUser({
        profile_xp: (user.profile_xp || 0) + result.xp_earned
      });

      // Mostrar novas badges se houver
      if (result.newBadges && result.newBadges.length > 0) {
        result.newBadges.forEach(badge => {
          showSuccess(`Nova conquista desbloqueada: ${badge}!`);
        });
      }

      // Carregar próximo conteúdo
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
      
      // Atualizar XP
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
      
      // Atualizar conteúdo atual com a lição gerada
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
      
      // Atualizar XP
      updateUser({
        profile_xp: (user.profile_xp || 0) + response.xp_earned
      });

    } catch (error) {
      showError('Erro ao gerar lição: ' + error.message);
    } finally {
      setLoadingContent(false);
    }
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
        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Objetivos da Lição */}
          {currentContent.objectives && (
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
    </div>
  );
};

export default LearningPage;