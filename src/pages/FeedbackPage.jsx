// Criar src/pages/FeedbackPage.jsx
import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const FeedbackPage = () => {
  const { user } = useAuth();
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadFeedbackData();
  }, []);

  const loadFeedbackData = async () => {
    try {
      const [history, analysisData, suggestionsData] = await Promise.all([
        feedbackAPI.getFeedbackHistory(),
        feedbackAPI.getFeedbackAnalysis(30),
        feedbackAPI.getImprovementSuggestions()
      ]);
      
      setFeedbackHistory(history.feedback);
      setAnalysis(analysisData);
      setSuggestions(suggestionsData.suggestions);
    } catch (error) {
      console.error('Erro ao carregar feedback:', error);
    }
  };

  const submitFeedback = async (feedbackData) => {
    try {
      await feedbackAPI.collectFeedback(feedbackData);
      // Recarregar dados
      loadFeedbackData();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Feedback */}
      {/* Análise de Satisfação */}
      {/* Sugestões Personalizadas */}
      {/* Histórico de Feedback */}
    </div>
  );
};

export default FeedbackPage;