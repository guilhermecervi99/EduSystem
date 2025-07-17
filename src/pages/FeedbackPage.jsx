// src/pages/FeedbackPage.jsx
import React, { useState, useEffect } from 'react';
import { feedbackAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { useNotification } from '../context/NotificationContext';
import { Star, MessageSquare, ThumbsUp, Lightbulb } from 'lucide-react';

const FeedbackPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do formulário
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeedbackData();
  }, []);

  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      // Em um cenário real, estas chamadas seriam para a API real.
      // const [historyData, suggestionsData] = await Promise.all([
      //   feedbackAPI.getFeedbackHistory(),
      //   feedbackAPI.getImprovementSuggestions()
      // ]);
      
      // Usando dados mockados para demonstração
      const historyData = { feedback: [
        { id: 'fb1', created_at: new Date().toISOString(), rating: 5, comments: 'A plataforma é incrível, muito intuitiva!' },
        { id: 'fb2', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), rating: 4, comments: 'Gostaria de mais projetos na área de Artes.' }
      ]};
      const suggestionsData = { suggestions: [
        "Tente explorar um projeto prático na sua área de interesse para aplicar o que aprendeu.",
        "Você parece gostar de desafios, que tal tentar uma avaliação de nível mais alto?",
        "Explore a seção de Recursos, há novos materiais sobre Tecnologia."
      ]};
      
      setFeedbackHistory(historyData.feedback || []);
      setSuggestions(suggestionsData.suggestions || []);
    } catch (error) {
      showError('Erro ao carregar dados de feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showError("Por favor, selecione uma avaliação de estrelas.");
      return;
    }
    setSubmitting(true);
    try {
      // Simulação de chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // await feedbackAPI.collectFeedback({
      //   session_type: feedbackType,
      //   rating: rating,
      //   comments: comment
      // });
      showSuccess("Seu feedback foi enviado com sucesso! Obrigado.");
      // Limpar formulário e recarregar dados
      setRating(0);
      setComment('');
      loadFeedbackData();
    } catch (error) {
      showError('Erro ao enviar feedback: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading size="lg" text="Carregando página de feedback..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold">Feedback e Melhorias</h1>
        <p className="text-cyan-100">Sua opinião é fundamental para evoluirmos juntos.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário de Feedback */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center"><MessageSquare className="mr-2" /> Deixe seu Feedback</Card.Title>
            <Card.Subtitle>Como está sendo sua experiência na plataforma?</Card.Subtitle>
          </Card.Header>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avaliação Geral</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transform transition-transform hover:scale-110">
                    <Star className={`h-8 w-8 transition-colors ${rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-gray-400'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700">Tipo de Feedback</label>
              <select id="feedbackType" value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option value="general">Geral</option>
                <option value="content">Conteúdo</option>
                <option value="bug">Reportar Bug</option>
                <option value="suggestion">Sugestão</option>
              </select>
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comentários</label>
              <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="4" className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md" placeholder="O que podemos melhorar? O que você mais gostou?"></textarea>
            </div>
            <Button type="submit" loading={submitting} disabled={submitting || rating === 0}>Enviar Feedback</Button>
          </form>
        </Card>

        {/* Sugestões Personalizadas */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center"><Lightbulb className="mr-2" /> Sugestões Para Você</Card.Title>
            <Card.Subtitle>Com base no seu progresso, sugerimos o seguinte:</Card.Subtitle>
          </Card.Header>
          {suggestions.length > 0 ? (
            <ul className="space-y-3">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <ThumbsUp className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-sm text-gray-800">{s}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500 text-center py-4">Continue estudando para receber sugestões personalizadas.</p>}
        </Card>
      </div>

      {/* Histórico de Feedback */}
      <Card>
        <Card.Header>
          <Card.Title>Seus Feedbacks Anteriores</Card.Title>
        </Card.Header>
        {feedbackHistory.length > 0 ? (
          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {feedbackHistory.map(fb => (
              <div key={fb.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>{new Date(fb.created_at).toLocaleDateString('pt-BR')}</span>
                  <div className="flex">{Array.from({length: 5}).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}</div>
                </div>
                <p className="text-sm text-gray-800">{fb.comments}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-500 text-center py-4">Você ainda não enviou nenhum feedback.</p>}
      </Card>
    </div>
  );
};

export default FeedbackPage;