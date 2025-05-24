
// pages/ResourcesPage.jsx
import React, { useState, useEffect } from 'react';
import { Library, ExternalLink, Star, Filter, Search, BookOpen } from 'lucide-react';
import { resourcesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const ResourcesPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadResources();
  }, [user?.current_track]);

  const loadResources = async () => {
    if (!user?.current_track) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const resourcesData = await resourcesAPI.getLearningResources(user.current_track);
      setResources(resourcesData || []);
    } catch (error) {
      showError('Erro ao carregar recursos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceAccess = async (resource) => {
    try {
      await resourcesAPI.registerResourceAccess({
        resource_id: resource.id,
        title: resource.title,
        resource_type: resource.type,
        area: user.current_track
      });
      
      if (resource.url) {
        window.open(resource.url, '_blank');
      }
      
      showSuccess('Recurso acessado!');
    } catch (error) {
      showError('Erro ao registrar acesso: ' + error.message);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || resource.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'livros': return '📚';
      case 'cursos online': return '💻';
      case 'vídeos': return '🎥';
      case 'ferramentas': return '🛠️';
      case 'canais youtube': return '📺';
      default: return '📖';
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      iniciante: 'text-green-600 bg-green-100',
      intermediário: 'text-blue-600 bg-blue-100',
      avançado: 'text-red-600 bg-red-100',
      geral: 'text-gray-600 bg-gray-100'
    };
    return colors[level] || colors.geral;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Carregando recursos..." />
      </div>
    );
  }

  if (!user?.current_track) {
    return (
      <Card className="text-center py-12">
        <Library className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Complete o mapeamento primeiro
        </h3>
        <p className="text-gray-600 mb-6">
          Para acessar recursos personalizados, complete o mapeamento de interesses
        </p>
        <Button onClick={() => onNavigate?.('mapping')}>
          Fazer Mapeamento
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-600 to-accent-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Recursos de Aprendizado</h1>
            <p className="text-accent-100">
              {resources.length} recursos disponíveis para {user.current_track}
            </p>
          </div>
          <Library className="h-16 w-16 text-accent-200" />
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos os níveis</option>
              <option value="iniciante">Iniciante</option>
              <option value="intermediário">Intermediário</option>
              <option value="avançado">Avançado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Recursos */}
      {filteredResources.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Nenhum recurso encontrado' : 'Nenhum recurso disponível'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Tente ajustar os termos de busca ou filtros'
              : 'Recursos para esta área ainda não foram adicionados'
            }
          </p>
          <Button onClick={() => onNavigate?.('learning')}>
            Continuar Aprendendo
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredResources.map((resource, index) => (
            <Card key={index} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-2xl">{getTypeIcon(resource.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {resource.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(resource.level)}`}>
                        {resource.level}
                      </span>
                    </div>
                    
                    {resource.description && (
                      <p className="text-gray-600 mb-3">
                        {resource.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="font-medium">{resource.type}</span>
                      {resource.author && (
                        <span>Por: {resource.author}</span>
                      )}
                      {resource.language && (
                        <span>Idioma: {resource.language}</span>
                      )}
                      {resource.estimated_duration && (
                        <span>Duração: {resource.estimated_duration}</span>
                      )}
                    </div>

                    {resource.rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{resource.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {resource.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    onClick={() => handleResourceAccess(resource)}
                    rightIcon={resource.url ? <ExternalLink className="h-4 w-4" /> : null}
                  >
                    {resource.url ? 'Acessar' : 'Ver'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showError('Funcionalidade em desenvolvimento')}
                  >
                    Avaliar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;