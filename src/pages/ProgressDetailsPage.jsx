// src/pages/ProgressDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { progressAPI, achievementsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { TrendingUp, Target, Clock, Award, BarChart2 } from 'lucide-react';
import Loading from '../components/common/Loading';

const ProgressDetailsPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [progressPath, setProgressPath] = useState(null);
  const [xpHistory, setXpHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetailedProgress();
  }, []);

  const loadDetailedProgress = async () => {
    setLoading(true);
    try {
      const [pathData, xpData] = await Promise.all([
        progressAPI.getProgressPath(),
        achievementsAPI.getXPHistory(30)
      ]);
      
      setProgressPath(pathData);
      setXpHistory(xpData);
    } catch (error) {
      showError('Erro ao carregar detalhes do progresso: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchTrack = async (newTrack) => {
    try {
      await progressAPI.switchTrack({ new_track: newTrack });
      showSuccess(`Trilha alterada para: ${newTrack}`);
      onNavigate('learning');
    } catch (error) {
      showError('Erro ao mudar de trilha: ' + error.message);
    }
  };

  if (loading) {
    return <Loading size="lg" text="Carregando seus detalhes de progresso..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-cyan-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Progresso Detalhado</h1>
            <p className="text-green-100">Uma visão completa da sua jornada de aprendizado.</p>
          </div>
        </div>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Trilha de Aprendizagem Atual</Card.Title>
          <Card.Subtitle>{progressPath?.area} - {progressPath?.subarea}</Card.Subtitle>
        </Card.Header>
        {progressPath?.progress_path ? (
          <div className="space-y-4">
            {Object.entries(progressPath.progress_path).map(([level, data]) => (
              <div key={level}>
                <h4 className="font-semibold capitalize">{level}</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{data.completed_modules} de {data.total_modules} módulos completos.</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(data.completed_modules / data.total_modules) * 100}%` }}></div>
                  </div>
                </div>
                <div className="mt-2 pl-4 border-l-2">
                  {data.modules.map((mod, index) => (
                     <p key={index} className={`text-sm ${mod.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{mod.title}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : <p>Nenhum progresso encontrado para a trilha atual.</p>}
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Histórico de XP (Últimos 30 dias)</Card.Title>
        </Card.Header>
        {xpHistory ? (
          <div className="h-64 bg-gray-50 p-4 rounded-lg">
            {/* Aqui entraria um componente de gráfico, ex: <BarChart data={xpHistory.history} /> */}
            <div className="flex items-center justify-center h-full text-gray-500">
              <BarChart2 className="h-8 w-8 mr-2" />
              <p>Visualização de gráfico a ser implementada.</p>
            </div>
            <p className="text-center mt-2 text-sm">Total ganho: {xpHistory.total_xp_earned} XP</p>
          </div>
        ) : <p>Não foi possível carregar o histórico de XP.</p>}
      </Card>

       <Card>
        <Card.Header>
          <Card.Title>Outras Ações</Card.Title>
        </Card.Header>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => onNavigate('mapping')}>Refazer Mapeamento</Button>
          {/* A funcionalidade de trocar de trilha pode ser mais complexa */}
          <Button variant="outline" onClick={() => showError("Funcionalidade em desenvolvimento")}>Trocar de Trilha</Button>
        </div>
      </Card>
    </div>
  );
};

export default ProgressDetailsPage;