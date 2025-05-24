// src/pages/ProgressDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';

const ProgressDetailsPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [progressPath, setProgressPath] = useState(null);
  const [xpHistory, setXpHistory] = useState(null);
  const [completedByLevel, setCompletedByLevel] = useState({});

  useEffect(() => {
    loadDetailedProgress();
  }, []);

  const loadDetailedProgress = async () => {
    try {
      const [path, xp] = await Promise.all([
        progressAPI.getProgressPath(),
        achievementsAPI.getXPHistory(30)
      ]);
      
      setProgressPath(path);
      setXpHistory(xp);
      
      // Organizar completados por nível
      organizeCompletedContent();
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const handleSwitchTrack = async (newTrack) => {
    try {
      await progressAPI.switchTrack(newTrack);
      showSuccess(`Mudou para trilha: ${newTrack}`);
      onNavigate('learning');
    } catch (error) {
      showError('Erro ao mudar trilha');
    }
  };

  return (
    <div className="space-y-6">
      {/* Visão geral do progresso */}
      {/* Gráfico de XP ao longo do tempo */}
      {/* Módulos/Lições completados por nível */}
      {/* Opção de trocar de trilha mantendo progresso */}
    </div>
  );
};