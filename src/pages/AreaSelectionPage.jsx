import React, { useState, useEffect } from 'react';
import { ChevronRight, RefreshCw, Shuffle, BookOpen, ArrowLeft } from 'lucide-react';
import { contentAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const AreaSelectionPage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [subareas, setSubareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [changingArea, setChangingArea] = useState(false);

  // Carregar áreas disponíveis
  useEffect(() => {
    // Se o usuário tem área recomendada do mapeamento, carregar direto as subáreas
    if (user?.recommended_track && !changingArea) {
      handleAreaSelect(user.recommended_track);
    } else {
      loadAreas();
    }
  }, [user?.recommended_track]);

  const loadAreas = async () => {
    try {
      const response = await contentAPI.browseAreas();
      setAreas(response.areas);
    } catch (error) {
      showError('Erro ao carregar áreas');
    }
  };

  // Carregar subáreas quando área for selecionada
  const handleAreaSelect = async (areaName) => {
    setLoading(true);
    try {
      const response = await contentAPI.getAreaDetails(areaName);
      setSelectedArea(areaName);
      setSubareas(response.subareas);
    } catch (error) {
      showError('Erro ao carregar subáreas');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREÇÃO PRINCIPAL: Definir área/subárea e inicializar progresso corretamente
  const handleSubareaSelect = async (subareaName) => {
    try {
      setLoading(true);
      
      console.log('🎯 Iniciando seleção de subárea:', {
        area: selectedArea,
        subarea: subareaName,
        currentUser: user
      });
      
      // 1. Verificar se já tem progresso nesta combinação área/subárea
      let hasExistingProgress = false;
      try {
        // Tentar carregar progresso existente para esta área/subárea
        const existingProgress = await progressAPI.getProgressForAreaSubarea(selectedArea, subareaName);
        hasExistingProgress = !!(existingProgress && existingProgress.module_index !== undefined);
        console.log('📊 Progresso existente encontrado:', existingProgress);
      } catch (error) {
        // Se não encontrar progresso, é normal - significa que é nova área
        console.log('📭 Nenhum progresso existente para esta área/subárea');
        hasExistingProgress = false;
      }
      
      // 2. Definir a área atual no backend
      console.log('🔧 Definindo área atual no backend...');
      await contentAPI.setCurrentArea(selectedArea, subareaName);
      
      // 3. ✅ CORREÇÃO CRÍTICA: Atualizar dados do usuário PRIMEIRO
      console.log('👤 Atualizando dados do usuário...');
      updateUser({
        current_track: selectedArea,
        current_subarea: subareaName
      });
      
      // 4. ✅ CORREÇÃO: Inicializar progresso se não existir
      if (!hasExistingProgress) {
        console.log('🚀 Inicializando progresso em 0,0,0 para nova área/subárea...');
        try {
          await progressAPI.navigateTo({
            area: selectedArea,
            subarea: subareaName,
            level: 'iniciante',
            module_index: 0,
            lesson_index: 0,
            step_index: 0
          });
          console.log('✅ Progresso inicializado com sucesso em 0,0,0');
        } catch (initError) {
          console.error('❌ Erro ao inicializar progresso:', initError);
          // Mesmo com erro de inicialização, vamos continuar
          showError('Progresso inicializado com problema, mas você pode continuar estudando');
        }
      } else {
        console.log('📚 Retornando ao progresso existente');
        showSuccess(`Retornando ao seu progresso em ${selectedArea} - ${subareaName}`);
      }
      
      // 5. Mostrar sucesso
      const message = hasExistingProgress 
        ? `Voltando para: ${selectedArea} - ${subareaName}` 
        : `Nova área definida: ${selectedArea} - ${subareaName}`;
      showSuccess(message);
      
      // 6. ✅ CORREÇÃO CRÍTICA: Aguardar um momento antes de navegar
      // para garantir que as mudanças foram processadas
      setTimeout(() => {
        console.log('🏠 Navegando para dashboard após delay...');
        onNavigate('dashboard');
      }, 1500); // 1,5 segundos de delay
      
    } catch (error) {
      console.error('❌ Erro completo na seleção de subárea:', error);
      showError('Erro ao definir área: ' + error.message);
      
      // Em caso de erro, reverter mudanças no usuário
      updateUser({
        current_track: user?.current_track || null,
        current_subarea: user?.current_subarea || null
      });
    } finally {
      setLoading(false);
    }
  };

  // Escolher subárea aleatória
  const handleRandomSubarea = async () => {
    if (!subareas || subareas.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * subareas.length);
    const randomSubarea = subareas[randomIndex];
    
    showSuccess(`Subárea escolhida aleatoriamente: ${randomSubarea.name}`);
    await handleSubareaSelect(randomSubarea.name);
  };

  // Voltar para seleção de áreas
  const handleBackToAreas = () => {
    setSelectedArea(null);
    setSubareas([]);
    setChangingArea(true);
    loadAreas();
  };

  return (
    <div className="space-y-6">
      {/* Lista de Áreas - só mostrar se não tem área selecionada */}
      {!selectedArea ? (
        <>
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Escolha sua Área de Estudo</h1>
            <p className="text-primary-100">
              {user?.recommended_track 
                ? `Sua área recomendada foi "${user.recommended_track}", mas você pode escolher outra se preferir`
                : 'Selecione a área que mais desperta seu interesse'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => {
              const isRecommended = area.name === user?.recommended_track;
              
              return (
                <Card
                  key={area.name}
                  hover
                  clickable
                  onClick={() => handleAreaSelect(area.name)}
                  className={isRecommended ? 'ring-2 ring-primary-500' : ''}
                >
                  <div className="p-4">
                    {isRecommended && (
                      <span className="inline-block mb-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                        Recomendada para você
                      </span>
                    )}
                    <h3 className="font-semibold text-lg mb-2">{area.name}</h3>
                    <p className="text-gray-600 text-sm">{area.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {area.subarea_count} subáreas
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Lista de Subáreas */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Escolha sua Subárea
                </h1>
                <p className="text-primary-100">
                  Área selecionada: {selectedArea}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Botão de escolha aleatória */}
                <Button
                  variant="accent"
                  onClick={handleRandomSubarea}
                  disabled={loading || subareas.length === 0}
                  leftIcon={<Shuffle className="h-5 w-5" />}
                >
                  Escolher Aleatoriamente
                </Button>
                
                {/* Botão para mudar de área */}
                {(changingArea || !user?.recommended_track || user?.recommended_track === selectedArea) && (
                  <Button
                    variant="secondary"
                    onClick={handleBackToAreas}
                    leftIcon={<ArrowLeft className="h-5 w-5" />}
                  >
                    Mudar Área
                  </Button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loading size="lg" text="Processando seleção..." />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {subareas.map((subarea) => {
                // Verificar se é a subárea atual do usuário
                const isCurrentSubarea = selectedArea === user?.current_track && 
                                       subarea.name === user?.current_subarea;
                
                return (
                  <Card
                    key={subarea.name}
                    hover
                    clickable
                    onClick={() => handleSubareaSelect(subarea.name)}
                    className={isCurrentSubarea ? 'ring-2 ring-green-500 bg-green-50' : ''}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{subarea.name}</h3>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-primary-600" />
                          {isCurrentSubarea && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Atual
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">{subarea.description}</p>
                      
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Tempo estimado:</span>
                          <span className="font-medium text-gray-700">{subarea.estimated_time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Níveis disponíveis:</span>
                          <span className="font-medium text-gray-700">{subarea.level_count}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant={isCurrentSubarea ? "success" : "primary"}
                          size="sm"
                          fullWidth
                          rightIcon={<ChevronRight className="h-4 w-4" />}
                          disabled={loading}
                        >
                          {loading ? 'Processando...' : 
                           isCurrentSubarea ? 'Continuar nesta subárea' : 'Começar com esta subárea'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Informação adicional */}
          <Card variant="flat">
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                💡 <strong>Dica:</strong> Não se preocupe se não souber qual escolher! 
              </p>
              <p className="text-sm text-gray-600">
                Você pode trocar de subárea a qualquer momento. Se você já estudou uma subárea antes, 
                seu progresso será mantido. Se for uma nova subárea, começaremos do zero.
              </p>
              
              {/* ✅ Indicador de processamento */}
              {loading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <Loading.Inline size="sm" />
                    <span className="text-sm text-blue-700">
                      Configurando sua nova área de estudo...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default AreaSelectionPage;