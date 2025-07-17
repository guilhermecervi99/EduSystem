import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Calendar,
  Target,
  Award,
  ChevronRight,
  X,
  CheckCircle,
  Star,
  FileText,
  Users,
  TrendingUp,
  BarChart,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Lightbulb,
  Code,
  Palette,
  Briefcase,
  Heart
} from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const ProjectsPage = ({ onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(null);
  const { user, updateUser } = useAuth();
  const { currentProgress } = useApp();
  const { showSuccess, showError, showInfo } = useNotification();

  // Estados para projetos disponíveis
  const [showAvailableProjects, setShowAvailableProjects] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Estados para edição
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Estados para feedback
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackProject, setFeedbackProject] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    difficulty_rating: 3,
    engagement_rating: 3,
    relevance_rating: 3,
    comments: '',
    suggestions: ''
  });

  // Estados para criar projeto
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    type: 'personal',
    area: user?.current_track || '',
    subarea: user?.current_subarea || '',
    level: 'iniciante'
  });

  // Debug log para verificar o estado do usuário
  useEffect(() => {
    console.log('🔍 ProjectsPage - User state:', {
      user: user,
      current_track: user?.current_track,
      current_subarea: user?.current_subarea,
      currentProgress: currentProgress
    });
  }, [user, currentProgress]);

  // Carregar projetos do usuário
  useEffect(() => {
    loadUserProjects();
  }, []);

  const loadUserProjects = async () => {
    try {
      const response = await projectsAPI.getUserProjects();
      setProjects(response.projects || []);
    } catch (error) {
      showError('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProjects = async () => {
    setLoadingAvailable(true);
    try {
      // Usar área e subárea do progresso atual (AppContext) ou do usuário (AuthContext)
      const area = currentProgress?.area || user?.current_track || 'Negócios e Empreendedorismo';
      const subarea = currentProgress?.subarea || user?.current_subarea || 'Finanças';
      
      console.log('🔍 Carregando projetos para:', { 
        area, 
        subarea,
        fromProgress: {
          area: currentProgress?.area,
          subarea: currentProgress?.subarea
        },
        fromUser: {
          current_track: user?.current_track,
          current_subarea: user?.current_subarea
        }
      });
      
      // Buscar projetos de todos os níveis da área/subárea atual
      const response = await projectsAPI.getAvailableProjects(
        area,
        subarea,
        'iniciante', // nível base
        true // show_all_levels = true
      );
      
      console.log('📦 Resposta recebida:', response);
      
      // Verificar se a resposta tem a estrutura esperada
      if (response && response.available_projects) {
        setAvailableProjects(response.available_projects);
      } else if (Array.isArray(response)) {
        // Se a resposta for diretamente um array
        setAvailableProjects(response);
      } else {
        // Se não houver projetos, definir array vazio
        setAvailableProjects([]);
      }
      
      setShowAvailableProjects(true);
    } catch (error) {
      console.error('❌ Erro ao carregar projetos disponíveis:', error);
      
      // Não mostrar erro se for 404, apenas definir lista vazia
      if (error.response?.status === 404) {
        setAvailableProjects([]);
        setShowAvailableProjects(true);
        showInfo('Nenhum projeto disponível para esta área no momento.');
      } else {
        showError('Erro ao carregar projetos disponíveis: ' + error.message);
      }
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title) {
      showError('Por favor, insira um título para o projeto');
      return;
    }

    try {
      // Usar área e subárea do progresso atual se disponível
      const projectData = {
        ...newProject,
        area: currentProgress?.area || newProject.area || user?.current_track,
        subarea: currentProgress?.subarea || newProject.subarea || user?.current_subarea
      };

      const response = await projectsAPI.createProject(projectData);
      showSuccess(`Projeto "${response.title}" criado com sucesso!`);
      setShowCreateModal(false);
      setNewProject({
        title: '',
        description: '',
        type: 'personal',
        area: '',
        subarea: '',
        level: 'iniciante'
      });
      loadUserProjects();

      // Atualizar XP se retornado
      if (response.xp_earned) {
        updateUser({
          profile_xp: (user.profile_xp || 0) + response.xp_earned
        });
      }
    } catch (error) {
      showError('Erro ao criar projeto: ' + error.message);
    }
  };

  const handleStartAvailableProject = async (project) => {
    try {
      const projectData = {
        title: project.title,
        description: project.description,
        type: project.type,
        area: currentProgress?.area || user?.current_track,
        subarea: currentProgress?.subarea || user?.current_subarea,
        level: project.level
      };

      const response = await projectsAPI.createProject(projectData);
      showSuccess(`Projeto "${response.title}" iniciado!`);
      setShowAvailableProjects(false);
      loadUserProjects();

      // Atualizar XP se retornado
      if (response.xp_earned) {
        updateUser({
          profile_xp: (user.profile_xp || 0) + response.xp_earned
        });
      }
    } catch (error) {
      showError('Erro ao iniciar projeto: ' + error.message);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editingProject.id) return;

    try {
      const updateData = {
        description: editingProject.description,
        outcomes: editingProject.outcomes || [],
        evidence_urls: editingProject.evidence_urls || []
      };

      await projectsAPI.updateProject(editingProject.id, updateData);
      showSuccess('Projeto atualizado com sucesso!');
      setShowEditModal(false);
      setEditingProject(null);
      loadUserProjects();
    } catch (error) {
      showError('Erro ao atualizar projeto: ' + error.message);
    }
  };

  const handleCompleteProject = async (project) => {
    if (!project.id) return;

    try {
      const completionData = {
        final_outcomes: project.outcomes || [],
        evidence_urls: project.evidence_urls || [],
        reflection: 'Projeto concluído com sucesso'
      };

      const response = await projectsAPI.completeProject(project.id, completionData);
      showSuccess(`Projeto concluído! +${response.xp_earned} XP`);
      
      // Atualizar XP
      updateUser({
        profile_xp: (user.profile_xp || 0) + response.xp_earned
      });

      loadUserProjects();
    } catch (error) {
      showError('Erro ao concluir projeto: ' + error.message);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackProject || !feedbackProject.id) return;

    try {
      const response = await projectsAPI.submitProjectFeedback(feedbackProject.id, feedbackData);
      showSuccess(`Feedback enviado! +${response.xp_earned} XP`);
      
      // Atualizar XP
      updateUser({
        profile_xp: (user.profile_xp || 0) + response.xp_earned
      });

      setShowFeedbackModal(false);
      setFeedbackProject(null);
      setFeedbackData({
        difficulty_rating: 3,
        engagement_rating: 3,
        relevance_rating: 3,
        comments: '',
        suggestions: ''
      });
    } catch (error) {
      showError('Erro ao enviar feedback: ' + error.message);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length
  };

  // Componente do Modal de Detalhes do Projeto
  const ProjectDetailsModal = ({ project, onClose }) => {
    if (!project) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
          
          <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status e Informações */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {project.status === 'completed' ? 'Concluído' : 
                     project.status === 'in_progress' ? 'Em Progresso' : 'Pausado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium capitalize">{project.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Início</p>
                  <p className="font-medium">{project.start_date}</p>
                </div>
                {project.completion_date && (
                  <div>
                    <p className="text-sm text-gray-500">Data de Conclusão</p>
                    <p className="font-medium">{project.completion_date}</p>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-gray-600">
                  {project.description || 'Sem descrição'}
                </p>
              </div>

              {/* Resultados */}
              {project.outcomes && project.outcomes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Resultados</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {project.outcomes.map((outcome, idx) => (
                      <li key={idx}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidências */}
              {project.evidence_urls && project.evidence_urls.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Evidências</h3>
                  <div className="space-y-2">
                    {project.evidence_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Evidência {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {project.status === 'in_progress' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingProject(project);
                        setShowEditModal(true);
                        onClose();
                      }}
                      leftIcon={<Edit className="h-4 w-4" />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => {
                        handleCompleteProject(project);
                        onClose();
                      }}
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                      Concluir
                    </Button>
                  </>
                )}
                
                {project.status === 'completed' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFeedbackProject(project);
                      setShowFeedbackModal(true);
                      onClose();
                    }}
                    leftIcon={<MessageSquare className="h-4 w-4" />}
                  >
                    Dar Feedback
                  </Button>
                )}
                
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente do Modal de Projetos Disponíveis
  const AvailableProjectsModal = ({ isOpen, onClose, projects, onStartProject }) => {
    if (!isOpen) return null;
    
    const projectsByLevel = projects.reduce((acc, project) => {
      const level = project.level || 'outros';
      if (!acc[level]) acc[level] = [];
      acc[level].push(project);
      return acc;
    }, {});
    
    const levelOrder = ['iniciante', 'intermediário', 'avançado', 'outros'];
    
    const currentArea = currentProgress?.area || user?.current_track || 'Negócios e Empreendedorismo';
    const currentSubarea = currentProgress?.subarea || user?.current_subarea || 'Finanças';
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
          
          <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Projetos Disponíveis</h2>
                <p className="text-gray-600 mt-1">
                  Área: {currentArea} - {currentSubarea}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Você pode fazer qualquer projeto, independente do seu progresso atual!
              </p>
            </div>

            {loadingAvailable ? (
              <div className="py-12 text-center">
                <Loading size="lg" text="Carregando projetos..." />
              </div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum projeto disponível para esta área/subárea no momento.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {levelOrder.map(level => {
                  const levelProjects = projectsByLevel[level];
                  if (!levelProjects || levelProjects.length === 0) return null;

                  return (
                    <div key={level}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                        Nível {level}
                      </h3>
                      <div className="space-y-4">
                        {levelProjects.map((project, idx) => (
                          <Card key={idx} hover>
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-semibold text-lg">{project.title}</h4>
                                    {project.recommended && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                        <Star className="h-3 w-3 mr-1" />
                                        Recomendado
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {project.estimated_duration || 'Duração variável'}
                                    </span>
                                    <span className="flex items-center">
                                      <Target className="h-4 w-4 mr-1" />
                                      {project.type}
                                    </span>
                                    {project.source && (
                                      <span className="flex items-center">
                                        <BookOpen className="h-4 w-4 mr-1" />
                                        {project.source}
                                      </span>
                                    )}
                                  </div>

                                  {project.requirements && project.requirements.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-sm font-medium text-gray-700 mb-1">Requisitos:</p>
                                      <ul className="text-sm text-gray-600 list-disc list-inside">
                                        {project.requirements.slice(0, 3).map((req, i) => (
                                          <li key={i}>{req}</li>
                                        ))}
                                        {project.requirements.length > 3 && (
                                          <li className="text-gray-500">
                                            +{project.requirements.length - 3} mais...
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                  {project.deliverables && project.deliverables.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-sm font-medium text-gray-700 mb-1">Entregas esperadas:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {project.deliverables.slice(0, 4).map((deliverable, i) => (
                                          <span
                                            key={i}
                                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                          >
                                            {deliverable}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => onStartProject(project)}
                                    leftIcon={<Plus className="h-4 w-4" />}
                                    disabled={!project.can_access}
                                  >
                                    {project.can_access ? 'Iniciar' : 'Bloqueado'}
                                  </Button>
                                </div>
                              </div>
                              
                              {!project.can_access && (
                                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                  <p className="text-sm text-yellow-800 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Complete os módulos anteriores para desbloquear
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal de Editar Projeto
  const EditProjectModal = () => {
    if (!showEditModal || !editingProject) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowEditModal(false)} />
          
          <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Editar Projeto</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ 
                    ...editingProject, 
                    description: e.target.value 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="4"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resultados (um por linha)
                </label>
                <textarea
                  value={(editingProject.outcomes || []).join('\n')}
                  onChange={(e) => setEditingProject({ 
                    ...editingProject, 
                    outcomes: e.target.value.split('\n').filter(o => o.trim()) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="4"
                  placeholder="Resultado 1&#10;Resultado 2&#10;Resultado 3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Links de Evidências (um por linha)
                </label>
                <textarea
                  value={(editingProject.evidence_urls || []).join('\n')}
                  onChange={(e) => setEditingProject({ 
                    ...editingProject, 
                    evidence_urls: e.target.value.split('\n').filter(u => u.trim()) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="https://github.com/seu-projeto&#10;https://seu-site.com"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateProject}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal de Feedback
  const FeedbackModal = () => {
    if (!showFeedbackModal || !feedbackProject) return null;

    const ratings = [
      { key: 'difficulty_rating', label: 'Dificuldade' },
      { key: 'engagement_rating', label: 'Engajamento' },
      { key: 'relevance_rating', label: 'Relevância' }
    ];

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowFeedbackModal(false)} />
          
          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Feedback do Projeto</h2>
            <p className="text-gray-600 mb-6">{feedbackProject.title}</p>
            
            <div className="space-y-4">
              {ratings.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => setFeedbackData({ ...feedbackData, [key]: value })}
                        className={`w-10 h-10 rounded-full ${
                          feedbackData[key] >= value 
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentários
                </label>
                <textarea
                  value={feedbackData.comments}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Compartilhe sua experiência..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sugestões
                </label>
                <textarea
                  value={feedbackData.suggestions}
                  onChange={(e) => setFeedbackData({ ...feedbackData, suggestions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="2"
                  placeholder="Como podemos melhorar?"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackProject(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Enviar Feedback
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Carregando projetos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Meus Projetos</h1>
            <div className="flex items-center space-x-6 text-primary-100">
              <span>{stats.total} projetos • {stats.completed} concluídos</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={loadAvailableProjects}
              leftIcon={<BookOpen className="h-5 w-5" />}
            >
              Explorar Projetos
            </Button>
            <Button
              variant="accent"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Novo Projeto
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="in_progress">Em Progresso</option>
              <option value="completed">Concluídos</option>
              <option value="paused">Pausados</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Lista de Projetos */}
      {filteredProjects.length === 0 ? (
        <Card className="text-center py-12">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum projeto ainda</h3>
          <p className="text-gray-600 mb-6">
            Comece criando seu primeiro projeto ou continue suas lições
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('learning')}
              leftIcon={<BookOpen className="h-5 w-5" />}
            >
              Continuar Aprendendo
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Criar Projeto
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              hover
              clickable
              onClick={() => setShowProjectDetails(project)}
              className="group"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{project.title}</h3>
                  {project.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || 'Sem descrição'}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {project.start_date}
                    </span>
                    {project.completion_date && (
                      <span className="text-success-600">
                        Concluído
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.type === 'final' ? 'bg-purple-100 text-purple-700' :
                      project.type === 'module' ? 'bg-blue-100 text-blue-700' :
                      project.type === 'lesson' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.type}
                    </span>
                    
                    {project.outcomes && project.outcomes.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {project.outcomes.length} resultados
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {project.status === 'completed' && (
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeedbackProject(project);
                          setShowFeedbackModal(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criar Projeto */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowCreateModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Criar Novo Projeto</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Projeto
                  </label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Meu App de Tarefas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="3"
                    placeholder="Descreva seu projeto..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Projeto
                  </label>
                  <select
                    value={newProject.type}
                    onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="personal">Pessoal</option>
                    <option value="lesson">De Lição</option>
                    <option value="module">De Módulo</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProject}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Criar Projeto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais */}
      <ProjectDetailsModal 
        project={showProjectDetails} 
        onClose={() => setShowProjectDetails(null)} 
      />
      
      <AvailableProjectsModal
        isOpen={showAvailableProjects}
        onClose={() => setShowAvailableProjects(false)}
        projects={availableProjects}
        onStartProject={handleStartAvailableProject}
      />
      
      <EditProjectModal />
      
      <FeedbackModal />
    </div>
  );
};

export default ProjectsPage;