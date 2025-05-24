
// pages/ProjectsPage.jsx
import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Filter, Search, Calendar, CheckCircle, Clock } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const ProjectsPage = ({ onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
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
            onClick={() => showError('Funcionalidade em desenvolvimento')}
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
            <Button variant="outline" onClick={() => showError('Funcionalidade em desenvolvimento')}>
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
                    onClick={() => showError('Funcionalidade em desenvolvimento')}
                  >
                    Ver Detalhes
                  </Button>
                  
                  {project.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => showError('Funcionalidade em desenvolvimento')}
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
    </div>
  );
};

export default ProjectsPage;