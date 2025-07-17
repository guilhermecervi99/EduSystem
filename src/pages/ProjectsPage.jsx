// pages/ProjectsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  CheckCircle, 
  Clock,
  X,
  ArrowRight,
  BookOpen,
  Target,
  Lightbulb,
  Award,
  Play,
  Pause
} from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadProjects();
  }, [filter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const statusFilter = filter === 'all' ? null : filter;
      const projectsData = await projectsAPI.getUserProjects(statusFilter);
      setProjects(projectsData.projects || []);
    } catch (error) {
      showError('Erro ao carregar projetos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      in_progress: 'text-blue-600 bg-blue-100',
      completed: 'text-green-600 bg-green-100',
      paused: 'text-yellow-600 bg-yellow-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusLabel = (status) => {
    const labels = {
      in_progress: 'Em Progresso',
      completed: 'Concluído',
      paused: 'Pausado'
    };
    return labels[status] || status;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'final': return '🎯';
      case 'module': return '📚';
      case 'lesson': return '📝';
      case 'personal': return '💡';
      default: return '📁';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      final: 'Projeto Final',
      module: 'Projeto de Módulo',
      lesson: 'Projeto de Lição',
      personal: 'Projeto Pessoal'
    };
    return labels[type] || 'Projeto';
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
      <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meus Projetos</h1>
            <p className="text-secondary-100">
              {projects.length} projetos • {projects.filter(p => p.status === 'completed').length} concluídos
            </p>
          </div>
          <Button
            variant="accent"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
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
      </Card>

      {/* Lista de Projetos */}
      {filteredProjects.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Tente ajustar os termos de busca ou filtros'
              : 'Comece criando seu primeiro projeto ou continue suas lições'
            }
          </p>
          <div className="space-x-4">
            <Button onClick={() => onNavigate?.('learning')}>
              Continuar Aprendendo
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(true)}>
              Criar Projeto
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project, index) => (
            <Card key={index} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-2xl">{getTypeIcon(project.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Iniciado em {project.start_date}</span>
                      </div>
                      
                      {project.completion_date && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Concluído em {project.completion_date}</span>
                        </div>
                      )}
                      
                      {project.status === 'in_progress' && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Em andamento</span>
                        </div>
                      )}
                    </div>

                    {project.outcomes && project.outcomes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Resultados:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {project.outcomes.slice(0, 2).map((outcome, outIndex) => (
                            <li key={outIndex} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{outcome}</span>
                            </li>
                          ))}
                          {project.outcomes.length > 2 && (
                            <li className="text-primary-600">
                              +{project.outcomes.length - 2} mais resultados
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProjectDetails(project)}
                  >
                    Ver Detalhes
                  </Button>
                  
                  {project.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => setShowProjectDetails(project)}
                    >
                      Continuar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação de Projeto */}
      <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={(newProject) => {
          loadProjects();
          showSuccess('Projeto criado com sucesso!');
        }}
        userArea={user?.current_track}
        userSubarea={user?.current_subarea}
      />

      {/* Modal de Detalhes do Projeto */}
      {showProjectDetails && (
        <ProjectDetailsModal
          project={showProjectDetails}
          onClose={() => setShowProjectDetails(null)}
          onUpdate={() => {
            loadProjects();
            setShowProjectDetails(null);
          }}
        />
      )}
    </div>
  );
};

// Componente do Modal de Criação
const CreateProjectModal = ({ isOpen, onClose, onProjectCreated, userArea, userSubarea }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'personal',
    description: '',
    area: userArea || '',
    subarea: userSubarea || '',
    level: 'iniciante'
  });
  const [creating, setCreating] = useState(false);
  const { showError } = useNotification();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showError('O título do projeto é obrigatório');
      return;
    }

    setCreating(true);
    try {
      const newProject = await projectsAPI.createProject(formData);
      onProjectCreated(newProject);
      onClose();
      
      // Limpar formulário
      setFormData({
        title: '',
        type: 'personal',
        description: '',
        area: userArea || '',
        subarea: userSubarea || '',
        level: 'iniciante'
      });
    } catch (error) {
      showError('Erro ao criar projeto: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Criar Novo Projeto</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Projeto *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Aplicativo de Lista de Tarefas"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Projeto
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="personal">💡 Projeto Pessoal</option>
                <option value="lesson">📝 Projeto de Lição</option>
                <option value="module">📚 Projeto de Módulo</option>
                <option value="final">🎯 Projeto Final</option>
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="4"
                placeholder="Descreva o objetivo e escopo do projeto..."
              />
            </div>

            {/* Área e Subárea */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Tecnologia"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subárea
                </label>
                <input
                  type="text"
                  value={formData.subarea}
                  onChange={(e) => setFormData({ ...formData, subarea: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Programação"
                />
              </div>
            </div>

            {/* Nível */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Dificuldade
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="iniciante">Iniciante</option>
                <option value="intermediário">Intermediário</option>
                <option value="avançado">Avançado</option>
              </select>
            </div>

            {/* Dicas sobre tipos de projeto */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                💡 Dicas para escolher o tipo:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Pessoal:</strong> Projetos de interesse próprio</li>
                <li>• <strong>Lição:</strong> Aplicar conceitos de uma lição específica</li>
                <li>• <strong>Módulo:</strong> Integrar conhecimentos de um módulo completo</li>
                <li>• <strong>Final:</strong> Demonstrar domínio de um nível ou área</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={creating}
                disabled={creating}
              >
                Criar Projeto
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente do Modal de Detalhes
const ProjectDetailsModal = ({ project, onClose, onUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    description: project.description || '',
    outcomes: project.outcomes || [],
    evidence_urls: project.evidence_urls || []
  });
  const { showSuccess, showError } = useNotification();

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await projectsAPI.completeProject(project.id, {
        final_outcomes: formData.outcomes,
        evidence_urls: formData.evidence_urls,
        reflection: "Projeto concluído com sucesso"
      });
      showSuccess('Projeto marcado como concluído!');
      onUpdate();
    } catch (error) {
      showError('Erro ao completar projeto: ' + error.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await projectsAPI.updateProject(project.id, formData);
      showSuccess('Projeto atualizado com sucesso!');
      setEditMode(false);
      onUpdate();
    } catch (error) {
      showError('Erro ao atualizar projeto: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const addOutcome = () => {
    setFormData({
      ...formData,
      outcomes: [...formData.outcomes, '']
    });
  };

  const updateOutcome = (index, value) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index] = value;
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  const removeOutcome = (index) => {
    const newOutcomes = formData.outcomes.filter((_, i) => i !== index);
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTypeIcon(project.type)}</span>
              <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Status e Informações */}
          <div className="flex items-center space-x-4 mb-6">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
            <span className="text-sm text-gray-500">
              {getTypeLabel(project.type)}
            </span>
            <span className="text-sm text-gray-500">
              Iniciado em {project.start_date}
            </span>
          </div>

          {/* Descrição */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Descrição</h3>
            {editMode ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="4"
              />
            ) : (
              <p className="text-gray-600">
                {project.description || 'Sem descrição'}
              </p>
            )}
          </div>

          {/* Resultados/Objetivos */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">
                {project.status === 'completed' ? 'Resultados' : 'Objetivos'}
              </h3>
              {editMode && project.status !== 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addOutcome}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Adicionar
                </Button>
              )}
            </div>
            
            {editMode ? (
              <div className="space-y-2">
                {formData.outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => updateOutcome(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Descreva um objetivo ou resultado..."
                    />
                    <button
                      onClick={() => removeOutcome(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {project.outcomes && project.outcomes.length > 0 ? (
                  project.outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">{outcome}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">Nenhum objetivo definido</li>
                )}
              </ul>
            )}
          </div>

          {/* Links/Evidências */}
          {project.evidence_urls && project.evidence_urls.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Links e Evidências</h3>
              <ul className="space-y-1">
                {project.evidence_urls.map((url, index) => (
                  <li key={index}>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between">
            <div>
              {project.status !== 'completed' && !editMode && (
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                >
                  Editar Projeto
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {editMode && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        description: project.description || '',
                        outcomes: project.outcomes || [],
                        evidence_urls: project.evidence_urls || []
                      });
                    }}
                    disabled={updating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    loading={updating}
                    disabled={updating}
                  >
                    Salvar Alterações
                  </Button>
                </>
              )}
              
              {project.status === 'in_progress' && !editMode && (
                <Button
                  variant="success"
                  onClick={handleComplete}
                  loading={completing}
                  disabled={completing}
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                >
                  Marcar como Concluído
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;