// pages/AchievementsPage.jsx
import React, { useState, useEffect } from 'react';
import { Award, Trophy, Star, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { achievementsAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const AchievementsPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { achievements, loadAchievements } = useApp();
  const [leaderboard, setLeaderboard] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdditionalData();
  }, []);

  const loadAdditionalData = async () => {
    setLoading(true);
    try {
      const [leaderboardData, streakData] = await Promise.all([
        achievementsAPI.getLeaderboard('xp', 10),
        achievementsAPI.getStudyStreak()
      ]);
      setLeaderboard(leaderboardData);
      setStreak(streakData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-600 bg-gray-100',
      rare: 'text-blue-600 bg-blue-100',
      epic: 'text-purple-600 bg-purple-100',
      legendary: 'text-yellow-600 bg-yellow-100'
    };
    return colors[rarity] || colors.common;
  };

  if (!achievements && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Carregando conquistas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-warning-600 to-warning-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Suas Conquistas</h1>
            <p className="text-warning-100">
              {achievements?.total_badges || 0} badges conquistadas • Nível {user?.profile_level || 1}
            </p>
          </div>
          <div className="text-center">
            <Trophy className="h-16 w-16 text-warning-200 mx-auto mb-2" />
            <p className="text-sm text-warning-100">
              {user?.profile_xp || 0} XP Total
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Badges por Categoria */}
        <div className="lg:col-span-2 space-y-6">
          {achievements?.badge_categories?.map((category, index) => (
            <Card key={index}>
              <Card.Header>
                <Card.Title>{category.name}</Card.Title>
                <Card.Subtitle>{category.total_count} badges</Card.Subtitle>
              </Card.Header>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.badges.map((badge, badgeIndex) => (
                  <div key={badgeIndex} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-2">
                      <Award className={`h-6 w-6 ${getRarityColor(badge.rarity)}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {badge.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {badge.earned_date}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {badge.description}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
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
                  {user?.profile_level || 1}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>XP Atual</span>
                  <span>{user?.profile_xp || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${((user?.profile_xp || 0) % 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Streak de Estudos */}
          {streak && (
            <Card>
              <Card.Header>
                <Card.Title>Sequência de Estudos</Card.Title>
              </Card.Header>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
                  <Calendar className="h-8 w-8 text-success-600" />
                </div>
                
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {streak.current_streak}
                </p>
                <p className="text-sm text-gray-600 mb-4">dias consecutivos</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maior sequência:</span>
                    <span className="font-medium">{streak.longest_streak} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de dias:</span>
                    <span className="font-medium">{streak.total_study_days} dias</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Leaderboard */}
          {leaderboard && (
            <Card>
              <Card.Header>
                <Card.Title>Ranking XP</Card.Title>
                <Card.Subtitle>Top 10 usuários</Card.Subtitle>
              </Card.Header>

              <div className="space-y-3">
                {leaderboard.entries.slice(0, 5).map((entry, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'}
                    `}>
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.user_id === user?.id ? 'Você' : entry.display_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Nível {entry.profile_level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.value} XP
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.current_user_position && leaderboard.current_user_position > 5 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-800">
                      {leaderboard.current_user_position}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-900">Sua posição</p>
                      <p className="text-xs text-gray-500">Nível {user?.profile_level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary-900">
                        {user?.profile_xp} XP
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Ações */}
          <Card>
            <Card.Header>
              <Card.Title>Ações</Card.Title>
            </Card.Header>

            <div className="space-y-2">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => loadAchievements(true)}
                loading={loading}
              >
                Atualizar Conquistas
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                size="sm"
                onClick={() => onNavigate?.('learning')}
              >
                Continuar Aprendendo
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

export default AchievementsPage;