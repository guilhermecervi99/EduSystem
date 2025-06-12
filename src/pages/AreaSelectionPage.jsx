const AreaSelectionPage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [subareas, setSubareas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar áreas disponíveis
  useEffect(() => {
    // Se o usuário tem área recomendada, carregar direto as subáreas
    if (user?.recommended_track) {
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
      {/* Lista de Áreas - só mostrar se não tem área recomendada */}
      {!selectedArea && !user?.recommended_track ? (
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
            {!user?.recommended_track && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedArea(null);
                  setSubareas([]);
                }}
              >
                ← Voltar
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                Escolha sua Subárea
              </h1>
              <p className="text-gray-600">
                Área: {selectedArea || user?.recommended_track}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {subareas.map((subarea) => {
              return (
                <Card
                  key={subarea.name}
                  hover
                  clickable
                  onClick={() => handleSubareaSelect(subarea.name)}
                >
                  <div className="p-4">
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