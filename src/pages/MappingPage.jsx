import React, { useState, useEffect } from 'react';
import { Target, ChevronRight, ChevronLeft, Star, Award, ArrowRight } from 'lucide-react';
import { mappingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';

const MappingPage = ({ onNavigate, onComplete }) => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [currentStep, setCurrentStep] = useState('intro');
  const [mappingSession, setMappingSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [textResponse, setTextResponse] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isRemapping, setIsRemapping] = useState(false);

  // ✅ CORREÇÃO: Detectar se é um re-mapeamento
  useEffect(() => {
    const hasExistingTrack = !!(user?.recommended_track || user?.current_track);
    setIsRemapping(hasExistingTrack);
    console.log('🗺️ MappingPage - Detectando tipo:', {
      hasExistingTrack,
      recommended_track: user?.recommended_track,
      current_track: user?.current_track,
      isRemapping: hasExistingTrack
    });
  }, [user]);

  // Inicializar mapeamento
  const startMapping = async () => {
    setLoading(true);
    try {
      const session = await mappingAPI.startMapping();
      setMappingSession(session);
      setResponses(Array(session.questions.length).fill().map((_, i) => ({
        question_id: session.questions[i].id,
        selected_options: []
      })));
      setCurrentStep('questions');
    } catch (error) {
      showError('Erro ao iniciar mapeamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Manipular seleção de opções
  const handleOptionSelect = (questionId, optionId) => {
    setResponses(prev => prev.map(response => {
      if (response.question_id === questionId) {
        const newSelected = response.selected_options.includes(optionId)
          ? response.selected_options.filter(id => id !== optionId)
          : [...response.selected_options, optionId];
        
        return {
          ...response,
          selected_options: newSelected
        };
      }
      return response;
    }));
  };

  // Avançar para próxima pergunta
  const nextQuestion = () => {
    if (currentQuestionIndex < mappingSession.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentStep('text');
    }
  };

  // Voltar para pergunta anterior
  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // ✅ CORREÇÃO PRINCIPAL: Submeter mapeamento e limpar dados conflitantes
  const submitMapping = async () => {
    setSubmitting(true);
    try {
      const mappingData = {
        session_id: mappingSession.session_id,
        responses: responses.filter(r => r.selected_options.length > 0),
        text_response: textResponse.trim() || null
      };

      console.log('📤 Submetendo mapeamento:', mappingData);
      const result = await mappingAPI.submitMapping(mappingData);
      setResult(result);
      setCurrentStep('result');
      
      // ✅ CORREÇÃO CRÍTICA: Ao fazer novo mapeamento, limpar current_track
      // para forçar a seleção de nova área
      const updateData = {
        recommended_track: result.recommended_track
      };
      
      // Se é um re-mapeamento, limpar a área atual para forçar nova seleção
      if (isRemapping) {
        console.log('🔄 Re-mapeamento detectado - limpando current_track');
        updateData.current_track = null;
        updateData.current_subarea = null;
      }
      
      console.log('👤 Atualizando usuário com:', updateData);
      updateUser(updateData);

      const message = isRemapping 
        ? `Re-mapeamento concluído! Nova área recomendada: ${result.recommended_track}`
        : `Mapeamento concluído! Sua área recomendada: ${result.recommended_track}`;
      
      showSuccess(message);
    } catch (error) {
      showError('Erro ao submeter mapeamento: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Verificar se pode avançar
  const canProceed = () => {
    if (currentStep === 'questions' && mappingSession) {
      const currentResponse = responses[currentQuestionIndex];
      return currentResponse && currentResponse.selected_options.length > 0;
    }
    return true;
  };

  // Renderizar introdução
  const renderIntro = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Target className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isRemapping ? 'Novo Mapeamento de Interesses' : 'Mapeamento de Interesses'}
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {isRemapping 
            ? 'Vamos descobrir suas novas áreas de interesse e criar uma nova trilha personalizada para você.'
            : 'Vamos descobrir suas áreas de interesse através de algumas perguntas. Isso nos ajudará a criar uma trilha de aprendizado personalizada para você.'
          }
        </p>
        
        {isRemapping && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <h3 className="font-semibold text-blue-900">Re-mapeamento</h3>
            </div>
            <p className="text-sm text-blue-800">
              Você já tinha uma área de estudo definida ({user?.current_track || user?.recommended_track}). 
              Ao finalizar este novo mapeamento, você poderá escolher uma nova área de estudo.
            </p>
          </div>
        )}
      </div>

      <Card className="text-left">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Como funciona:
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary-600">1</span>
            </div>
            <p className="text-gray-700">
              Responda às perguntas sobre suas preferências e interesses
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary-600">2</span>
            </div>
            <p className="text-gray-700">
              Descreva seus hobbies e atividades favoritas (opcional)
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary-600">3</span>
            </div>
            <p className="text-gray-700">
              {isRemapping 
                ? 'Escolha sua nova área de estudo e comece a aprender!'
                : 'Receba sua trilha personalizada e comece a aprender!'
              }
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <Button
          size="lg"
          onClick={startMapping}
          loading={loading}
          rightIcon={<ArrowRight className="h-5 w-5" />}
        >
          {isRemapping ? 'Começar Novo Mapeamento' : 'Começar Mapeamento'}
        </Button>
      </div>
    </div>
  );

  // Renderizar perguntas
  const renderQuestions = () => {
    if (!mappingSession || !mappingSession.questions[currentQuestionIndex]) {
      return <Loading text="Carregando perguntas..." />;
    }

    const question = mappingSession.questions[currentQuestionIndex];
    const currentResponse = responses[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / mappingSession.questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Pergunta {currentQuestionIndex + 1} de {mappingSession.questions.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {question.question}
          </h2>

          <div className="grid gap-3">
            {Object.entries(question.options).map(([optionId, option]) => {
              const isSelected = currentResponse?.selected_options.includes(optionId);
              
              return (
                <button
                  key={optionId}
                  onClick={() => handleOptionSelect(question.id, optionId)}
                  className={`
                    p-4 text-left border-2 rounded-lg transition-all duration-200
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50 text-primary-900' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                      ${isSelected 
                        ? 'border-primary-500 bg-primary-500' 
                        : 'border-gray-300'
                      }
                    `}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.text}</p>
                      {option.area && (
                        <p className="text-sm text-gray-500 mt-1">
                          Área: {option.area}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Anterior
            </Button>

            <Button
              onClick={nextQuestion}
              disabled={!canProceed()}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              {currentQuestionIndex === mappingSession.questions.length - 1 ? 'Finalizar' : 'Próxima'}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  // Renderizar análise de texto
  const renderTextAnalysis = () => (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Conte-nos mais sobre você (Opcional)
        </h2>
        <p className="text-gray-600 mb-6">
          Descreva seus hobbies, interesses, atividades favoritas ou qualquer coisa que gosta de fazer. 
          Isso nos ajudará a personalizar ainda mais sua trilha de aprendizado.
        </p>

        <textarea
          value={textResponse}
          onChange={(e) => setTextResponse(e.target.value)}
          placeholder="Ex: Gosto de programar, jogar videogames, desenhar, tocar violão, fazer experimentos científicos..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('questions')}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Voltar
          </Button>

          <Button
            onClick={submitMapping}
            loading={submitting}
            rightIcon={<Star className="h-4 w-4" />}
          >
            {submitting ? 'Analisando...' : 'Finalizar Mapeamento'}
          </Button>
        </div>
      </Card>
    </div>
  );

  // ✅ CORREÇÃO: Renderizar resultado com navegação correta
  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
            <Award className="h-8 w-8 text-success-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isRemapping ? 'Novo Mapeamento Concluído!' : 'Mapeamento Concluído!'}
          </h1>
          <p className="text-lg text-gray-600">
            {isRemapping 
              ? 'Sua nova trilha de aprendizado personalizada está pronta'
              : 'Sua trilha de aprendizado personalizada está pronta'
            }
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Trilha Recomendada */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isRemapping ? 'Sua Nova Trilha Principal' : 'Sua Trilha Principal'}
            </h3>
            <div className="text-center p-6 bg-primary-50 rounded-lg">
              <h4 className="text-xl font-bold text-primary-900 mb-2">
                {result.recommended_track}
              </h4>
              {result.recommended_subarea && (
                <p className="text-primary-700">
                  Foco inicial: {result.recommended_subarea}
                </p>
              )}
            </div>
          </Card>

          {/* Badges Conquistadas */}
          {result.badges_earned && result.badges_earned.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Conquistas Desbloqueadas
              </h3>
              <div className="space-y-2">
                {result.badges_earned.map((badge, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-warning-50 rounded-lg">
                    <Award className="h-4 w-4 text-warning-600" />
                    <span className="text-sm font-medium text-warning-800">{badge}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Áreas de Interesse */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Suas Áreas de Interesse
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.area_scores.slice(0, 6).map((area, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{area.area}</h4>
                  <span className="text-xs text-gray-500">#{area.rank}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${area.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {Math.round(area.percentage)}% de compatibilidade
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => {
              console.log('🎯 Finalizando mapeamento, chamando onComplete...');
              
              // ✅ CORREÇÃO: Sempre chamar onComplete para ir para seleção de áreas
              // O AppRouter vai detectar que tem recommended_track mas não current_track
              // e vai mostrar a AreaSelectionPage
              if (onComplete) {
                onComplete();
              } else if (onNavigate) {
                // Fallback: ir para seleção de áreas
                onNavigate('areas');
              } else {
                console.error('Nenhuma função de navegação disponível!');
                showError('Erro ao navegar. Por favor, recarregue a página.');
              }
            }}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            {isRemapping ? 'Escolher Nova Subárea' : 'Escolher Subárea'}
          </Button>
        </div>
      </div>
    );
  };
  
  // Render principal
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {currentStep === 'intro' && renderIntro()}
        {currentStep === 'questions' && renderQuestions()}
        {currentStep === 'text' && renderTextAnalysis()}
        {currentStep === 'result' && renderResult()}
      </div>
    </div>
  );
};

export default MappingPage;