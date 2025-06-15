// pages/ResourcesPage.jsx - VERSÃO MELHORADA
import React, { useState, useEffect } from 'react';
import { 
  Library, 
  ExternalLink, 
  Star, 
  Filter, 
  Search, 
  BookOpen, 
  Eye,
  Clock,
  Globe,
  User,
  Tag,
  RefreshCw
} from 'lucide-react';
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
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Obter subárea atual do usuário se disponível
  const currentSubarea = user?.progress?.current?.subarea;

  useEffect(() => {
    loadResources();
  }, [user?.current_track, currentSubarea]);

  const loadResources = async () => {
    if (!user?.current_track) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Carregando recursos para:', {
        area: user.current_track,
        subarea: currentSubarea
      });

      // Buscar recursos da área atual, priorizando a subárea se disponível
      const resourcesData = await resourcesAPI.getLearningResources(
        user.current_track,
        currentSubarea, // Passa a subárea se disponível
        null, // level
        null  // category
      );
      
      console.log('📚 Recursos carregados:', resourcesData?.length || 0);
      setResources(resourcesData || []);
    } catch (error) {
      console.error('❌ Erro ao carregar recursos:', error);
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
      } else {
        showSuccess('Recurso visualizado!');
      }
      
      showSuccess('Acesso registrado! +2 XP');
    } catch (error) {
      showError('Erro ao registrar acesso: ' + error.message);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || resource.level === levelFilter;
    const matchesType = typeFilter === 'all' || resource.type.toLowerCase().includes(typeFilter.toLowerCase());
    return matchesSearch && matchesLevel && matchesType;
  });

  const getTypeIcon = (type) => {
    const typeMap = {
      'livros': '📚',
      'cursos online': '💻',
      'vídeos': '🎥',
      'ferramentas': '🛠️',
      'canais youtube': '📺',
      'canais': '📺',
      'sites': '🌐',
      'plataformas': '⚡',
      'séries': '🎬',
      'revistas': '📰',
      'blogs': '✍️',
      'arquivos': '📁'
    };
    
    const lowerType = type.toLowerCase();
    for (const [key, icon] of Object.entries(typeMap)) {
      if (lowerType.includes(key)) return icon;
    }
    return '📖';
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

  const getUniqueTypes = () => {
    const types = [...new Set(resources.map(r => r.type))];
    return types.sort();
  };

  const getUniqueAuthors = () => {
    const authors = [...new Set(resources.map(r => r.author).filter(a => a))];
    return authors.sort();
  };

  const ResourceStats = () => {
    const stats = {
      total: resources.length,
      byLevel: resources.reduce((acc, r) => {
        acc[r.level] = (acc[r.level] || 0) + 1;
        return acc;
      }, {}),
      byType: resources.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {}),
      withUrl: resources.filter(r => r.url).length
    };

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-800">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.withUrl}</div>
          <div className="text-sm text-green-800">Com Link</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.byType).length}</div>
          <div className="text-sm text-purple-800">Tipos</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{Object.keys(stats.byLevel).length}</div>
          <div className="text-sm text-orange-800">Níveis</div>
        </div>
      </div>
    );
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
              {currentSubarea && ` › ${currentSubarea}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={loadResources}
              disabled={loading}
              className="text-white border-white hover:bg-white hover:text-accent-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Library className="h-16 w-16 text-accent-200" />
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {resources.length > 0 && <ResourceStats />}

      {/* Filtros e Busca */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar recursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:ml-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {(levelFilter !== 'all' || typeFilter !== 'all') && (
                <span className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-600 rounded-full">
                  {[levelFilter, typeFilter].filter(f => f !== 'all').length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nível</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos os níveis</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediário">Intermediário</option>
                  <option value="avançado">Avançado</option>
                  <option value="geral">Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Todos os tipos</option>
                  {getUniqueTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLevelFilter('all');
                    setTypeFilter('all');
                    setSearchTerm('');
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de Recursos */}
      {filteredResources.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || levelFilter !== 'all' || typeFilter !== 'all' 
              ? 'Nenhum recurso encontrado' 
              : 'Nenhum recurso disponível'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || levelFilter !== 'all' || typeFilter !== 'all'
              ? 'Tente ajustar os termos de busca ou filtros'
              : `Recursos para ${user.current_track} ainda não foram adicionados`
            }
          </p>
          {(searchTerm || levelFilter !== 'all' || typeFilter !== 'all') && (
            <Button 
              onClick={() => {
                setSearchTerm('');
                setLevelFilter('all');
                setTypeFilter('all');
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredResources.map((resource, index) => (
            <Card key={index} hover className="transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="text-3xl flex-shrink-0">{getTypeIcon(resource.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {resource.title}
                      </h3>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(resource.level)}`}>
                          {resource.level}
                        </span>
                        {resource.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{resource.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {resource.description && (
                      <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                        {resource.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {resource.type}
                      </span>
                      {resource.author && (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {resource.author}
                        </span>
                      )}
                      {resource.language && resource.language !== 'pt-BR' && (
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {resource.language}
                        </span>
                      )}
                      {resource.estimated_duration && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {resource.estimated_duration}
                        </span>
                      )}
                    </div>

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.slice(0, 5).map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 5 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                            +{resource.tags.length - 5} mais
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 flex-shrink-0 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleResourceAccess(resource)}
                    rightIcon={resource.url ? <ExternalLink className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    className="whitespace-nowrap"
                  >
                    {resource.url ? 'Acessar' : 'Ver'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showError('Funcionalidade em desenvolvimento')}
                    className="whitespace-nowrap"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Avaliar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer com informações adicionais */}
      {resources.length > 0 && (
        <Card className="bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            <p>
              Mostrando {filteredResources.length} de {resources.length} recursos disponíveis.
              {currentSubarea && (
                <> Recursos filtrados para <span className="font-medium">{currentSubarea}</span>.</>
              )}
            </p>
            <p className="mt-2">
              💡 <span className="font-medium">Dica:</span> Acesse recursos para ganhar XP e melhorar seu aprendizado!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResourcesPage;