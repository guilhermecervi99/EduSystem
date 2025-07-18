import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, Plus, Search, Filter, CheckCircle, 
  Clock, Award, ExternalLink, Edit, Trash2,
  Target, Calendar, Tag, BarChart3, Upload,
  BookOpen, ChevronRight, X, Star, FileText,
  Users, TrendingUp, BarChart, Eye, Download,
  Share2, MessageSquare, AlertCircle, CheckCircle2,
  Circle, ArrowRight, Lightbulb, Code, Palette,
  Briefcase, Heart, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { projectsAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';

const ProjectsPage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { currentProgress, loadStatistics } = useApp();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [projects, setProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAvailableProjects, setShowAvailableProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackProject, setFeedbackProject] = useState(null);
  const [projectStats, setProjectStats] = useState({
    active: 0,
    completed: 0,
    total: 0
  });
  
  // Estados para feedback
  const [feedbackData, setFeedbackData] = useState({
    difficulty_rating: 3,
    engagement_rating: 3,
    relevance_rating: 3,
    comments: '',
    suggestions: ''
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
  const loadUserProjects = useCallback(async () => {
    try {
      const response = await projectsAPI.getUserProjects(filter);
      setProjects(response.projects || []);
      setProjectStats({
        active: response.active_count || 0,
        completed: response.completed_count || 0,
        total: response.total || 0
      });
    } catch (error) {
      showError('Erro ao carregar projetos');
    }
  }, [filter, showError]);

  // Carregar projetos disponíveis
  const loadAvailableProjects = useCallback(async () => {
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
        currentProgress?.level || 'iniciante',
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
  }, [currentProgress, user, showError, showInfo]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadUserProjects();
      setLoading(false);
    };
    loadData();
  }, [loadUserProjects]);

  // Criar novo projeto
  const handleCreateProject = async (projectData) => {
    try {
      const newProject = await projectsAPI.createProject({
        ...projectData,
        area: currentProgress?.area || user?.current_track || 'Negócios e Empreendedorismo',
        subarea: currentProgress?.subarea || user?.current_subarea || 'Finanças',
        level: currentProgress?.level || 'iniciante'
      });
      
      showSuccess(`Projeto "${projectData.title}" criado com sucesso!`);
      setShowCreateModal(false);
      loadUserProjects();
      loadStatistics(); // Atualizar XP
      
      // Atualizar XP se retornado
      if (newProject.xp_earned) {
        updateUser({
          profile_xp: (user.profile_xp || 0) + newProject.xp_earned
        });
      }
    } catch (error) {
      showError('Erro ao criar projeto: ' + error.message);
    }
  };

  // Iniciar projeto disponível
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

  // Atualizar projeto
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

  // Completar projeto
  const handleCompleteProject = async (projectId, completionData) => {
    try {
      const result = await projectsAPI.completeProject(projectId, completionData);
      showSuccess(`Projeto concluído! +${result.xp_earned} XP ganhos!`);
      
      if (result.new_level) {
        showInfo(`Parabéns! Você subiu para o nível ${result.new_level}!`);
      }
      
      // Atualizar XP
      updateUser({
        profile_xp: (user.profile_xp || 0) + result.xp_earned
      });
      
      loadUserProjects();
      loadStatistics();
    } catch (error) {
      showError('Erro ao completar projeto');
    }
  };

  // Enviar feedback
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

  // Filtrar projetos
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || project.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <Loading size="lg" text="Carregando projetos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-600 to-accent-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Folder className="h-8 w-8" />
              <span>Meus Projetos</span>
            </h1>
            <p className="text-secondary-100 mt-2">
              Gerencie seus projetos e acompanhe seu progresso
            </p>
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
              size="lg"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Novo Projeto
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <p className="text-3xl font-bold">{projectStats.active}</p>
            <p className="text-sm">Em Progresso</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <p className="text-3xl font-bold">{projectStats.completed}</p>
            <p className="text-sm">Concluídos</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <p className="text-3xl font-bold">{projectStats.total}</p>
            <p className="text-sm">Total</p>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'in_progress' ? 'primary' : 'outline'}
              onClick={() => setFilter('in_progress')}
            >
              Em Progresso
            </Button>
            <Button
              variant={filter === 'completed' ? 'primary' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Concluídos
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Projetos */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={() => {
                setSelectedProject(project);
                setShowDetailsModal(true);
              }}
              onComplete={() => handleCompleteProject(project.id, {})}
              onEdit={() => {
                setEditingProject(project);
                setShowEditModal(true);
              }}
              onFeedback={() => {
                setFeedbackProject(project);
                setShowFeedbackModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro projeto!'}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => onNavigate('learning')}
                leftIcon={<BookOpen className="h-4 w-4" />}
              >
                Continuar Aprendendo
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Criar Projeto
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Projetos Sugeridos */}
      {availableProjects.length > 0 && !showAvailableProjects && (
        <Card>
          <Card.Header>
            <Card.Title>Projetos Sugeridos</Card.Title>
            <Card.Subtitle>Baseados no seu progresso atual</Card.Subtitle>
          </Card.Header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProjects.slice(0, 4).map((project, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setShowCreateModal(true);
                  // Pré-preencher com dados do projeto sugerido
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {project.type}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {project.estimated_duration || '2-4 semanas'}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateProject({
                        title: project.title,
                        type: project.type,
                        description: project.description
                      });
                    }}
                  >
                    Iniciar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
        availableProjects={availableProjects}
        currentProgress={currentProgress}
        user={user}
      />

      <ProjectDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        project={selectedProject}
        onComplete={handleCompleteProject}
        onUpdate={loadUserProjects}
        onEdit={(project) => {
          setEditingProject(project);
          setShowEditModal(true);
          setShowDetailsModal(false);
        }}
        onFeedback={(project) => {
          setFeedbackProject(project);
          setShowFeedbackModal(true);
          setShowDetailsModal(false);
        }}
      />
      
      <AvailableProjectsModal
        isOpen={showAvailableProjects}
        onClose={() => setShowAvailableProjects(false)}
        projects={availableProjects}
        onStartProject={handleStartAvailableProject}
        currentProgress={currentProgress}
        user={user}
        loadingAvailable={loadingAvailable}
      />
      
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onUpdate={handleUpdateProject}
      />
      
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setFeedbackProject(null);
        }}
        project={feedbackProject}
        feedbackData={feedbackData}
        setFeedbackData={setFeedbackData}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
};

// Componente de Card de Projeto
const ProjectCard = ({ project, onView, onComplete, onEdit, onFeedback }) => {
  const getStatusColor = (status) => {
    return status === 'completed' ? 'text-green-600' : 'text-blue-600';
  };

  const getStatusIcon = (status) => {
    return status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />;
  };

  return (
    <Card hover clickable onClick={onView} className="group">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-gray-900 line-clamp-2">{project.title}</h3>
          <span className={`flex items-center ${getStatusColor(project.status)}`}>
            {getStatusIcon(project.status)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {project.description || 'Sem descrição'}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {project.start_date}
          </span>
          
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            project.type === 'final' ? 'bg-purple-100 text-purple-700' :
            project.type === 'module' ? 'bg-blue-100 text-blue-700' :
            project.type === 'lesson' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {project.type}
          </span>
        </div>
        
        {project.outcomes && project.outcomes.length > 0 && (
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <Target className="h-3 w-3 mr-1" />
            {project.outcomes.length} resultados
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2">
            {project.status === 'in_progress' && (
              <>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="text-gray-400 hover:text-success-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {project.status === 'completed' && (
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback();
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
  );
};

// Modal de Criação de Projeto
const CreateProjectModal = ({ isOpen, onClose, onCreate, availableProjects, currentProgress, user }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'personal',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onCreate(formData);
    setFormData({ title: '', type: 'personal', description: '' });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Projeto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título do Projeto"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Ex: Aplicativo de Lista de Tarefas"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Projeto
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="personal">Pessoal</option>
            <option value="lesson">Lição</option>
            <option value="module">Módulo</option>
            <option value="final">Final</option>
            <option value="discovery">Descoberta</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Descreva os objetivos e escopo do projeto..."
          />
        </div>

        {availableProjects.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 font-medium mb-2">
              💡 Projetos Recomendados:
            </p>
            <div className="space-y-1">
              {availableProjects.slice(0, 3).map((proj, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({
                    title: proj.title,
                    type: proj.type,
                    description: proj.description
                  })}
                  className="text-xs text-blue-600 hover:underline text-left"
                >
                  • {proj.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!formData.title.trim()}>
            Criar Projeto
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Detalhes do Projeto
const ProjectDetailsModal = ({ isOpen, onClose, project, onComplete, onUpdate, onEdit, onFeedback }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [outcomes, setOutcomes] = useState([]);
  const [evidenceUrls, setEvidenceUrls] = useState([]);
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    if (project) {
      setOutcomes(project.outcomes || []);
      setEvidenceUrls(project.evidence_urls || []);
    }
  }, [project]);

  const handleComplete = async () => {
    await onComplete(project.id, {
      final_outcomes: outcomes,
      evidence_urls: evidenceUrls,
      reflection
    });
    onClose();
  };

  if (!isOpen || !project) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={project.title}
      size="lg"
    >
      <div className="space-y-4">
        {/* Status e Datas */}
        <div className="flex items-center justify-between">
          <span className={`flex items-center space-x-2 ${
            project.status === 'completed' ? 'text-green-600' : 'text-blue-600'
          }`}>
            {project.status === 'completed' ? <CheckCircle /> : <Clock />}
            <span className="font-medium">
              {project.status === 'completed' ? 'Concluído' : 'Em Progresso'}
            </span>
          </span>
          
          <div className="text-sm text-gray-500">
            Iniciado em: {project.start_date}
            {project.completion_date && ` • Concluído em: ${project.completion_date}`}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
          <p className="text-gray-600">
            {project.description || 'Sem descrição disponível.'}
          </p>
        </div>

        {/* Resultados */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Resultados</h4>
          {isEditing ? (
            <div className="space-y-2">
              {outcomes.map((outcome, idx) => (
                <div key={idx} className="flex space-x-2">
                  <Input
                    value={outcome}
                    onChange={(e) => {
                      const newOutcomes = [...outcomes];
                      newOutcomes[idx] = e.target.value;
                      setOutcomes(newOutcomes);
                    }}
                    placeholder="Descreva um resultado..."
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOutcomes(outcomes.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOutcomes([...outcomes, ''])}
              >
                Adicionar Resultado
              </Button>
            </div>
          ) : (
            outcomes.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {outcomes.map((outcome, idx) => (
                  <li key={idx} className="text-gray-600">{outcome}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum resultado registrado.</p>
            )
          )}
        </div>

        {/* Evidências */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Evidências</h4>
          {isEditing ? (
            <div className="space-y-2">
              {evidenceUrls.map((url, idx) => (
                <div key={idx} className="flex space-x-2">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...evidenceUrls];
                      newUrls[idx] = e.target.value;
                      setEvidenceUrls(newUrls);
                    }}
                    placeholder="URL da evidência..."
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEvidenceUrls(evidenceUrls.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEvidenceUrls([...evidenceUrls, ''])}
                leftIcon={<Upload className="h-4 w-4" />}
              >
                Adicionar Evidência
              </Button>
            </div>
          ) : (
            evidenceUrls.length > 0 ? (
              <div className="space-y-1">
                {evidenceUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {url}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhuma evidência adicionada.</p>
            )
          )}
        </div>

        {/* Reflexão (apenas para conclusão) */}
        {project.status === 'in_progress' && isEditing && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Reflexão</h4>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="O que você aprendeu com este projeto?"
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          
          <div className="space-x-3">
            {project.status === 'in_progress' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (isEditing) {
                      handleComplete();
                    } else {
                      onEdit(project);
                    }
                  }}
                  leftIcon={<Edit className="h-4 w-4" />}
                >
                  Editar
                </Button>
                
                {isEditing && (
                  <Button
                    onClick={handleComplete}
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                  >
                    Concluir Projeto
                  </Button>
                )}
              </>
            )}
            
            {project.status === 'completed' && (
              <Button
                variant="outline"
                onClick={() => onFeedback(project)}
                leftIcon={<MessageSquare className="h-4 w-4" />}
              >
                Dar Feedback
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Modal de Projetos Disponíveis
const AvailableProjectsModal = ({ isOpen, onClose, projects, onStartProject, currentProgress, user, loadingAvailable }) => {
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
                                  {project.can_access !== false ? 'Iniciar' : 'Bloqueado'}
                                </Button>
                              </div>
                            </div>
                            
                            {project.can_access === false && (
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
const EditProjectModal = ({ isOpen, onClose, project, onUpdate }) => {
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    if (project) {
      setEditingProject({
        ...project,
        outcomes: project.outcomes || [],
        evidence_urls: project.evidence_urls || []
      });
    }
  }, [project]);

  const handleUpdate = async () => {
    if (!editingProject) return;
    await onUpdate(editingProject);
  };

  if (!isOpen || !editingProject) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
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
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
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
const FeedbackModal = ({ isOpen, onClose, project, feedbackData, setFeedbackData, onSubmit }) => {
  if (!isOpen || !project) return null;

  const ratings = [
    { key: 'difficulty_rating', label: 'Dificuldade' },
    { key: 'engagement_rating', label: 'Engajamento' },
    { key: 'relevance_rating', label: 'Relevância' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-bold mb-4">Feedback do Projeto</h2>
          <p className="text-gray-600 mb-6">{project.title}</p>
          
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
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
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

export default ProjectsPage;