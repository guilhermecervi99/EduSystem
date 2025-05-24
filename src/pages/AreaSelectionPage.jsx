// Criar novo componente: src/pages/AreaSelectionPage.jsx
import React, { useState, useEffect } from 'react';
import { contentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { BookOpen, Star, ChevronRight } from 'lucide-react';

const AreaSelectionPage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [subareas, setSubareas] = useState([]);
  const [recommendedSubarea, setRecommendedSubarea] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carregar áreas disponíveis
  useEffect(() => {
    loadAreas();
  }, []);

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
      
      // Identificar subárea recomendada baseada no mapeamento
      if (user?.recommended_subarea) {
        const recommended = response.subareas.find(
          sub => sub.name === user.recommended_subarea
        );
        setRecommendedSubarea(recommended);
      }
    } catch (error) {
      showError('Erro ao carregar subáreas');
    } finally {
      setLoading(false);
    }
  };

  // Definir área e subárea atual
  const handleSubareaSelect = async (subareaName) => {
    try {
      await contentAPI.setCurrentArea(selectedArea, subareaName);
      updateUser({
        current_track: selectedArea,
        current_subarea: subareaName
      });
      showSuccess(`Área definida: ${selectedArea} - ${subareaName}`);
      onNavigate('learning');
    } catch (error) {
      showError('Erro ao definir área');
    }
  };

  return (
    <div className="space-y-6">
      {/* Lista de Áreas */}
      {!selectedArea ? (
        <>
          <h1 className="text-2xl font-bold">Escolha sua Área de Estudo</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Card
                key={area.name}
                hover
                clickable
                onClick={() => handleAreaSelect(area.name)}
              >
                <div className="p-4">
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
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Lista de Subáreas */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedArea(null);
                setSubareas([]);
              }}
            >
              ← Voltar
            </Button>
            <h1 className="text-2xl font-bold">
              Subáreas de {selectedArea}
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {subareas.map((subarea) => {
              const isRecommended = subarea.name === recommendedSubarea?.name;
              
              return (
                <Card
                  key={subarea.name}
                  hover
                  clickable
                  onClick={() => handleSubareaSelect(subarea.name)}
                  className={isRecommended ? 'ring-2 ring-primary-500' : ''}
                >
                  <div className="p-4">
                    {isRecommended && (
                      <div className="flex items-center space-x-1 text-primary-600 mb-2">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">Recomendada</span>
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-2">{subarea.name}</h3>
                    <p className="text-gray-600 text-sm">{subarea.description}</p>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Tempo estimado: {subarea.estimated_time}</p>
                      <p>{subarea.level_count} níveis disponíveis</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AreaSelectionPage;