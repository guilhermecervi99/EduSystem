// AssessmentPage.jsx - VERSÃO COMPLETA COM FEEDBACK MELHORADO
import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronRight,
  FileText,
  Send,
  Lightbulb
} from 'lucide-react';
import { analyticsAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const AssessmentPage = ({ onNavigate, navigationState }) => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Estados
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Refs
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Debug
  useEffect(() => {
    console.log('🔍 AssessmentPage - navigationState:', navigationState);
    console.log('🔍 AssessmentPage - assessment:', navigationState?.assessment);
    console.log('🔍 AssessmentPage - assessmentId:', navigationState?.assessmentId);
  }, [navigationState]);
  
  // Carregar avaliação
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (navigationState?.assessment && navigationState?.assessment.questions) {
          console.log('✅ Usando assessment do navigationState');
          setAssessment(navigationState.assessment);
          startTimeRef.current = Date.now();
        } else if (navigationState?.assessmentId) {
          console.log('📥 Carregando assessment do backend');
          await loadAssessment(navigationState.assessmentId);
        } else {
          console.error('❌ Nenhuma avaliação encontrada');
          showError('Nenhuma avaliação encontrada');
          setTimeout(() => onNavigate?.('dashboard'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigationState]);
  
  // Timer
  useEffect(() => {
    if (assessment && !showResults && !loading) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [assessment, showResults, loading]);
  
  // Debug da estrutura quando assessment mudar
  useEffect(() => {
    if (assessment) {
      console.log('📋 Estrutura da avaliação:', assessment);
      console.log('📋 Primeira questão:', assessment.questions?.[0]);
    }
  }, [assessment]);
  
  // Carregar avaliação do backend
  const loadAssessment = async (assessmentId) => {
    try {
      const data = await analyticsAPI.getAssessmentDetails(assessmentId);
      console.log('📥 Dados recebidos do backend:', data);
      
      if (data.assessment) {
        setAssessment(data.assessment);
        startTimeRef.current = Date.now();
      } else {
        throw new Error('Estrutura de avaliação inválida');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar avaliação:', error);
      showError('Erro ao carregar avaliação');
      setTimeout(() => onNavigate?.('dashboard'), 2000);
    }
  };
  
  // Formatar tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Manipular resposta
  const handleAnswer = (answer) => {
    setAnswers({
      ...answers,
      [currentQuestion]: answer
    });
  };
  
  // Navegar entre questões
  const goToQuestion = (index) => {
    if (index >= 0 && index < assessment.questions.length) {
      setCurrentQuestion(index);
    }
  };
  
  // Função helper para gerar dicas de estudo
  const getStudyTip = (result, questionIndex) => {
    const tips = [
      "Revise o conteúdo desta lição novamente, focando nos conceitos principais.",
      "Pratique mais exercícios similares para fixar o conhecimento.",
      "Assista aos vídeos complementares sobre este tópico.",
      "Faça anotações dos pontos principais e revise regularmente.",
      "Discuta este tópico com outros estudantes no fórum.",
      "Tente explicar o conceito com suas próprias palavras."
    ];
    
    // Se tem tópico específico, dar dica contextualizada
    if (result.topic) {
      return `Revise o tópico "${result.topic}" e pratique mais questões relacionadas.`;
    }
    
    // Senão, retornar dica aleatória baseada no índice
    return tips[questionIndex % tips.length];
  };

  // Função helper para calcular resumo por tópico
  const getTopicSummary = (detailedResults) => {
    const topicMap = {};
    
    detailedResults.forEach(result => {
      const topic = result.topic || 'Geral';
      if (!topicMap[topic]) {
        topicMap[topic] = { name: topic, correct: 0, total: 0 };
      }
      topicMap[topic].total++;
      if (result.isCorrect) {
        topicMap[topic].correct++;
      }
    });
    
    return Object.values(topicMap).map(topic => ({
      ...topic,
      accuracy: Math.round((topic.correct / topic.total) * 100)
    }));
  };
  
  const handleSubmit = async () => {
    // Verificar se todas as questões foram respondidas
    const unanswered = assessment.questions.filter((_, index) => !answers[index]).length;
    if (unanswered > 0) {
      const confirm = window.confirm(
        `Você deixou ${unanswered} questão(ões) sem resposta. Deseja enviar mesmo assim?`
      );
      if (!confirm) return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calcular resultado
      let correctAnswers = 0;
      const detailedResults = assessment.questions.map((question, index) => {
        const userAnswer = answers[index];
        let isCorrect = false;
        let score = 0;
        
        if (question.type === 'dissertativa' || question.type === 'open_ended') {
          // Para questões dissertativas, considerar como correta se tem resposta válida
          isCorrect = userAnswer && userAnswer.trim().length >= 50;
          score = isCorrect ? 100 : 0;
        } else {
          // Para múltipla escolha
          isCorrect = userAnswer === question.correct_answer;
          score = isCorrect ? 100 : 0;
        }
        
        if (isCorrect) correctAnswers++;
        
        return {
          questionId: question.id || index + 1,
          question: question.question || question.text || `Questão ${index + 1}`,
          questionType: question.type || 'multiple_choice',
          topic: question.topic || null,
          userAnswer: userAnswer || '',
          correctAnswer: question.correct_answer || 'N/A',
          isCorrect,
          score,
          explanation: question.explanation || ''
        };
      });
      
      const totalScore = Math.round((correctAnswers / assessment.questions.length) * 100);
      const passed = totalScore >= (assessment.passing_score || 70);
      
      // Preparar dados completos para salvar
      const assessmentResult = {
        assessment_id: navigationState?.assessmentId || `temp_${Date.now()}`,
        user_id: user?.id || user?.email,
        assessment_type: navigationState?.metadata?.difficulty || 'adaptive',
        title: assessment.title,
        area: user?.current_track || navigationState?.metadata?.area || 'Tecnologia',
        subarea: user?.current_subarea || navigationState?.metadata?.subarea || 'Geral',
        level: navigationState?.metadata?.level || user?.progress?.current?.level || 'iniciante',
        score: totalScore,
        passed,
        questions_correct: correctAnswers,
        total_questions: assessment.questions.length,
        time_taken_seconds: timeElapsed,
        time_taken_minutes: Math.ceil(timeElapsed / 60),
        answers: answers,
        detailed_results: detailedResults,
        completed_at: new Date().toISOString(),
        metadata: {
          ...navigationState?.metadata,
          difficulty: assessment.difficulty || 'medium',
          topics: [...new Set(assessment.questions.map(q => q.topic).filter(Boolean))]
        }
      };
      
      // Se temos um assessmentId real, enviar para o backend
      if (navigationState?.assessmentId && !navigationState.assessmentId.startsWith('temp_')) {
        try {
          await analyticsAPI.submitAssessmentResponse(navigationState.assessmentId, {
            answers,
            detailed_results: detailedResults,
            score: totalScore,
            passed,
            time_taken_seconds: timeElapsed,
            completed_at: assessmentResult.completed_at
          });
          console.log('✅ Respostas enviadas ao backend');
        } catch (error) {
          console.warn('⚠️ Erro ao enviar respostas ao backend:', error);
        }
      }
      
      // Registrar conclusão no progresso
      try {
        const progressResult = await progressAPI.completeAssessment({
          assessment_id: assessmentResult.assessment_id,
          assessment_type: assessmentResult.assessment_type,
          score: totalScore,
          questions_correct: correctAnswers,
          total_questions: assessment.questions.length,
          time_taken_minutes: Math.ceil(timeElapsed / 60),
          area_name: assessmentResult.area,
          subarea_name: assessmentResult.subarea,
          level_name: assessmentResult.level,
          module_title: assessment.title || 'Avaliação',
          detailed_results: detailedResults
        });
        
        // Atualizar XP se retornado
        if (progressResult?.xp_earned) {
          updateUser({
            profile_xp: (user.profile_xp || 0) + progressResult.xp_earned
          });
        }
      } catch (error) {
        console.error('⚠️ Erro ao registrar progresso:', error);
      }
      
      // Mostrar resultados
      setResults({
        score: totalScore,
        passed,
        correctAnswers,
        totalQuestions: assessment.questions.length,
        timeElapsed,
        detailedResults
      });
      
      setShowResults(true);
      
      if (passed) {
        showSuccess(`Parabéns! Você passou com ${totalScore}%!`);
      } else {
        showInfo(`Você obteve ${totalScore}%. Continue estudando!`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar avaliação:', error);
      showError('Erro ao enviar avaliação: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Extrair texto da questão
  const getQuestionText = (question) => {
    return question?.question || question?.text || question?.content || 'Questão sem texto';
  };
  
  // Extrair opções da questão
  const getQuestionOptions = (question) => {
    if (question?.options && Array.isArray(question.options)) {
      return question.options;
    }
    
    // Fallback para estrutura alternativa
    if (question?.alternatives) {
      return question.alternatives;
    }
    
    // Fallback genérico
    return ['A) Opção 1', 'B) Opção 2', 'C) Opção 3', 'D) Opção 4'];
  };
  
  if (loading) {
    return <Loading text="Carregando avaliação..." />;
  }
  
  if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Avaliação não disponível
          </h2>
          <p className="text-gray-600 mb-6">
            Não foi possível carregar a avaliação solicitada.
          </p>
          <Button onClick={() => onNavigate?.('dashboard')}>
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }
  
  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  
  if (showResults && results) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>Resultados da Avaliação</Card.Title>
            <Card.Subtitle>{assessment.title}</Card.Subtitle>
          </Card.Header>
          
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-3xl font-bold mb-2 ${
                results.passed ? 'text-success-600' : 'text-warning-600'
              }`}>
                {results.score}%
              </div>
              <p className="text-sm text-gray-600">Pontuação</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold mb-2 text-primary-600">
                {results.correctAnswers}/{results.totalQuestions}
              </div>
              <p className="text-sm text-gray-600">Respostas Corretas</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold mb-2 text-secondary-600">
                {formatTime(results.timeElapsed)}
              </div>
              <p className="text-sm text-gray-600">Tempo Total</p>
            </div>
          </div>
          
          {/* Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            results.passed 
              ? 'bg-success-50 border border-success-200' 
              : 'bg-warning-50 border border-warning-200'
          }`}>
            <div className="flex items-center space-x-2">
              {results.passed ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <span className="font-medium text-success-700">Aprovado!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-warning-600" />
                  <span className="font-medium text-warning-700">
                    Não aprovado - Nota mínima: {assessment.passing_score || 70}%
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Revisão das questões */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Revisão Detalhada das Questões</h3>
            
            {results.detailedResults.map((result, index) => (
              <Card key={index} className={`border-l-4 ${
                result.isCorrect ? 'border-success-500' : 'border-error-500'
              }`}>
                <div className="p-4">
                  {/* Header da questão */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {result.isCorrect ? (
                          <div className="flex items-center justify-center w-8 h-8 bg-success-100 rounded-full">
                            <CheckCircle className="h-5 w-5 text-success-600" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 bg-error-100 rounded-full">
                            <XCircle className="h-5 w-5 text-error-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          Questão {index + 1}
                        </p>
                        <p className="text-gray-700 mb-3">
                          {result.question}
                        </p>
                      </div>
                    </div>
                    
                    {/* Score da questão */}
                    <div className="text-right ml-4">
                      <span className={`text-lg font-bold ${
                        result.isCorrect ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {result.score || 0}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Respostas */}
                  <div className="ml-11 space-y-2">
                    {/* Resposta do usuário */}
                    <div className={`p-3 rounded-lg ${
                      result.isCorrect 
                        ? 'bg-success-50 border border-success-200' 
                        : 'bg-error-50 border border-error-200'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <span className="text-sm font-medium text-gray-600">Sua resposta:</span>
                        <span className={`text-sm ${
                          result.isCorrect ? 'text-success-700' : 'text-error-700'
                        }`}>
                          {result.userAnswer || 'Não respondida'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Resposta correta (se errou) */}
                    {!result.isCorrect && result.questionType !== 'dissertativa' && (
                      <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <span className="text-sm font-medium text-gray-600">Resposta correta:</span>
                          <span className="text-sm text-success-700 font-medium">
                            {result.correctAnswer}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Feedback para dissertativa */}
                    {result.questionType === 'dissertativa' && !result.isCorrect && (
                      <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                        <p className="text-sm text-warning-700">
                          <strong>Feedback:</strong> Sua resposta precisa ter pelo menos 50 caracteres 
                          para ser considerada completa. Tente elaborar mais sua resposta.
                        </p>
                      </div>
                    )}
                    
                    {/* Explicação da questão */}
                    {result.explanation && (
                      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Explicação:
                            </p>
                            <p className="text-sm text-blue-800">
                              {result.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Dicas de estudo (se errou) */}
                    {!result.isCorrect && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-900 mb-1">
                              Dica de Estudo:
                            </p>
                            <p className="text-sm text-amber-800">
                              {getStudyTip(result, index)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumo por tópico */}
          {results.detailedResults.length > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Resumo por Tópico</h4>
              <div className="space-y-3">
                {getTopicSummary(results.detailedResults).map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{topic.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        topic.accuracy >= 70 ? 'text-success-600' : 'text-warning-600'
                      }`}>
                        {topic.accuracy}% de acerto
                      </span>
                      <span className="text-xs text-gray-500">
                        ({topic.correct}/{topic.total})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Ações */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => onNavigate?.('dashboard')}
            >
              Voltar ao Dashboard
            </Button>
            
            <div className="space-x-3">
              {!results.passed && (
                <Button
                  variant="secondary"
                  onClick={() => onNavigate?.('learning')}
                >
                  Revisar Conteúdo
                </Button>
              )}
              
              <Button
                onClick={() => onNavigate?.('progress-details')}
              >
                Ver Progresso
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
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <p className="text-gray-600">{assessment.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center space-x-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{formatTime(timeElapsed)}</span>
              </div>
              <p className="text-xs text-gray-500">Tempo</p>
            </div>
            
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {currentQuestion + 1}/{assessment.questions.length}
              </div>
              <p className="text-xs text-gray-500">Questão</p>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>
      
      {/* Questão */}
      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Questão {currentQuestion + 1}
            </h2>
            {question.topic && (
              <span className="text-sm text-gray-500">
                Tópico: {question.topic}
              </span>
            )}
            {question.difficulty && (
              <span className="text-sm text-gray-500 ml-3">
                Dificuldade: {question.difficulty}
              </span>
            )}
          </div>
          
          <p className="text-gray-800 text-lg">{getQuestionText(question)}</p>
          
          {/* Opções ou Campo de Texto */}
          <div className="space-y-3">
            {question.type === 'dissertativa' || question.type === 'open_ended' ? (
              // Campo de texto para questões dissertativas
              <div>
                <textarea
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition-colors resize-none"
                  rows={6}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Mínimo de 50 caracteres para uma resposta completa
                </p>
              </div>
            ) : (
              // Opções de múltipla escolha
              getQuestionOptions(question).map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option.charAt(0))}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion] === option.charAt(0)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-gray-800">{option}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Card>
      
      {/* Navegação */}
      <Card>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => goToQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
          >
            Anterior
          </Button>
          
          <div className="flex items-center space-x-2">
            {assessment.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  index === currentQuestion
                    ? 'bg-primary-600 text-white'
                    : answers[index] !== undefined
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {currentQuestion < assessment.questions.length - 1 ? (
            <Button
              onClick={() => goToQuestion(currentQuestion + 1)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Próxima
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              rightIcon={<Send className="h-4 w-4" />}
            >
              Enviar Avaliação
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AssessmentPage;