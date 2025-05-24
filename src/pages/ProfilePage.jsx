// pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Edit3, 
  Save, 
  X,
  Star,
  Target,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { usersAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';

const ProfilePage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { statistics, loadStatistics } = useApp();
  const { showSuccess, showError } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    email: user?.email || '',
    age: user?.age || 14,
    learning_style: user?.learning_style || 'didático'
  });

  useEffect(() => {
    if (!statistics) {
      loadStatistics();
    }
  }, [statistics, loadStatistics]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersAPI.updateUser(user.id, editData);
      updateUser(editData);
      setIsEditing(false);
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      email: user?.email || '',
      age: user?.age || 14,
      learning_style: user?.learning_style || 'didático'
    });
    setIsEditing(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Não informado';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  const getLevelProgress = () => {
    const currentXP = user?.profile_xp || 0;
    const currentLevel = user?.profile_level || 1;
    const xpForNextLevel = currentLevel * 100; // Simplificado
    const xpInCurrentLevel = currentXP % 100;
    const progressPercentage = (xpInCurrentLevel / 100) * 100;
    
    return {
      currentLevel,
      currentXP,
      xpInCurrentLevel,
      xpForNextLevel: 100,
      xpNeeded: 100 - xpInCurrentLevel,
      progressPercentage
    };
  };

  const levelInfo = getLevelProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {user?.email ? (
                <span className="text-3xl font-bold text-white">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user?.email || 'Usuário'}</h1>
              <p className="text-primary-100">
                Membro desde {formatDate(user?.created_at)}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Nível {user?.profile_level || 1}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>{user?.profile_xp || 0} XP</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span>{user?.total_badges || 0} Badges</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            variant="accent"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={isEditing ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
          >
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>Informações Pessoais</Card.Title>
              <Card.Subtitle>Seus dados básicos e preferências</Card.Subtitle>
            </Card.Header>

            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  leftIcon={<Mail className="h-5 w-5" />}
                  fullWidth
                />

                <Input
                  label="Idade"
                  type="number"
                  min="10"
                  max="100"
                  value={editData.age}
                  onChange={(e) => setEditData({...editData, age: parseInt(e.target.value)})}
                  leftIcon={<Calendar className="h-5 w-5" />}
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estilo de Aprendizado
                  </label>
                  <select
                    value={editData.learning_style}
                    onChange={(e) => setEditData({...editData, learning_style: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="didático">Didático</option>
                    <option value="socrático">Socrático</option>
                    <option value="storytelling">Storytelling</option>
                    <option value="visual">Visual</option>
                    <option value="gamificado">Gamificado</option>
                    <option value="projeto">Baseado em Projetos</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Salvar Alterações
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{user?.email || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Idade</p>
                      <p className="text-sm text-gray-600">{user?.age || 'Não informado'} anos</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Estilo de Aprendizado</p>
                      <p className="text-sm text-gray-600 capitalize">{user?.learning_style || 'Didático'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Trilha Atual</p>
                      <p className="text-sm text-gray-600">{user?.current_track || 'Não definida'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Estatísticas de Aprendizado */}
          <Card>
            <Card.Header>
              <Card.Title>Estatísticas de Aprendizado</Card.Title>
              <Card.Subtitle>Seu progresso até agora</Card.Subtitle>
            </Card.Header>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary-900">
                  {statistics?.completed_lessons || 0}
                </p>
                <p className="text-sm text-primary-700">Lições Completadas</p>
              </div>

              <div className="text-center p-4 bg-secondary-50 rounded-lg">
                <Target className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-secondary-900">
                  {statistics?.completed_projects || 0}
                </p>
                <p className="text-sm text-secondary-700">Projetos Finalizados</p>
              </div>

              <div className="text-center p-4 bg-warning-50 rounded-lg">
                <Award className="h-8 w-8 text-warning-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning-900">
                  {statistics?.certifications || 0}
                </p>
                <p className="text-sm text-warning-700">Certificações</p>
              </div>

              <div className="text-center p-4 bg-success-50 rounded-lg">
                <Clock className="h-8 w-8 text-success-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-success-900">
                  {Math.floor((statistics?.total_study_time_minutes || 0) / 60)}h
                </p>
                <p className="text-sm text-success-700">Tempo de Estudo</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progresso do Nível */}
          <Card>
            <Card.Header>
              <Card.Title>Progresso do Nível</Card.Title>
            </Card.Header>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-primary-600">
                  {levelInfo.currentLevel}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {levelInfo.xpNeeded} XP para o próximo nível
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${levelInfo.progressPercentage}%` }}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpForNextLevel} XP
              </p>
            </div>
          </Card>

          {/* Trilha Atual */}
          {user?.current_track && (
            <Card>
              <Card.Header>
                <Card.Title>Trilha Atual</Card.Title>
              </Card.Header>

              <div className="text-center">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-accent-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {user.current_track}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => onNavigate?.('learning')}
                >
                  Continuar Estudando
                </Button>
              </div>
            </Card>
          )}

          {/* Ações Rápidas */}
          <Card>
            <Card.Header>
              <Card.Title>Ações Rápidas</Card.Title>
            </Card.Header>

            <div className="space-y-2">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('achievements')}
                leftIcon={<Award className="h-4 w-4" />}
              >
                Ver Conquistas
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('projects')}
                leftIcon={<Target className="h-4 w-4" />}
              >
                Meus Projetos
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('mapping')}
                leftIcon={<Target className="h-4 w-4" />}
              >
                Refazer Mapeamento
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('dashboard')}
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;