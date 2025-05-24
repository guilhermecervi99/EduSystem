// pages/TeacherPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Lightbulb, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import { llmAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

const TeacherPage = ({ onNavigate }) => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Olá! Sou seu professor virtual. Estou aqui para ajudar com suas dúvidas sobre ${user?.current_track || 'seus estudos'}. Como posso te ajudar hoje?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuickQuestion, setSelectedQuickQuestion] = useState(null);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    "Explique conceitos básicos de programação",
    "Como funciona machine learning?",
    "Dicas para melhorar minhas habilidades",
    "Projetos práticos que posso fazer",
    "Como se manter motivado estudando",
    "Recursos recomendados para aprender"
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (questionText = null) => {
    const question = questionText || inputValue.trim();
    if (!question || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = user?.current_track ? `Estou estudando ${user.current_track}` : '';
      const response = await llmAPI.askTeacher(question, context);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Atualizar XP do usuário
      if (response.xp_earned) {
        updateUser({
          profile_xp: (user.profile_xp || 0) + response.xp_earned
        });
        showSuccess(`+${response.xp_earned} XP por fazer uma pergunta!`);
      }

    } catch (error) {
      showError('Erro ao comunicar com o professor: ' + error.message);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setSelectedQuickQuestion(question);
    handleSendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateLesson = async () => {
    setIsLoading(true);
    try {
      const lessonData = {
        topic: 'Tópico personalizado baseado no seu progresso',
        subject_area: user?.current_track || 'Geral',
        knowledge_level: 'iniciante',
        teaching_style: user?.learning_style || 'didático',
        duration_minutes: 30
      };

      const response = await llmAPI.generateLesson(lessonData);
      
      const lessonMessage = {
        id: Date.now(),
        type: 'bot',
        content: `## ${response.lesson_content.title}\n\n${response.lesson_content.introduction}\n\n### Conteúdo Principal\n\n${response.lesson_content.main_content.map(section => `**${section.subtitle}**\n${section.content}`).join('\n\n')}`,
        timestamp: new Date(),
        isLesson: true
      };

      setMessages(prev => [...prev, lessonMessage]);

      if (response.xp_earned) {
        updateUser({
          profile_xp: (user.profile_xp || 0) + response.xp_earned
        });
        showSuccess(`Lição gerada! +${response.xp_earned} XP`);
      }

    } catch (error) {
      showError('Erro ao gerar lição: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `Olá! Sou seu professor virtual. Estou aqui para ajudar com suas dúvidas sobre ${user?.current_track || 'seus estudos'}. Como posso te ajudar hoje?`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Chat Principal */}
      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col">
          {/* Header do Chat */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Professor Virtual</h2>
                <p className="text-sm text-gray-500">
                  {isLoading ? 'Digitando...' : 'Online'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateLesson}
                disabled={isLoading}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Gerar Lição
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Limpar
              </Button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[70%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary-100 text-primary-600' 
                      : message.isError
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-primary-600 text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : message.isLesson
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className={`text-sm ${message.isLesson ? 'prose prose-sm max-w-none' : ''}`}>
                      {message.isLesson ? (
                        <div dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/##\s(.+)/g, '<h2 class="text-lg font-semibold mb-2">$1</h2>')
                            .replace(/###\s(.+)/g, '<h3 class="text-base font-medium mb-2">$1</h3>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n\n/g, '</p><p class="mb-2">')
                            .replace(/^/, '<p class="mb-2">')
                            .replace(/$/, '</p>')
                        }} />
                      ) : (
                        message.content.split('\n').map((line, index) => (
                          <p key={index} className={index > 0 ? 'mt-2' : ''}>
                            {line}
                          </p>
                        ))
                      )}
                    </div>
                    <div className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loading.Inline size="sm" />
                    <span className="ml-2 text-sm text-gray-600">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensagem */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  disabled={isLoading}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows="2"
                />
              </div>
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                size="lg"
                rightIcon={<Send className="h-4 w-4" />}
              >
                Enviar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Perguntas Rápidas */}
        <Card>
          <Card.Header>
            <Card.Title>Perguntas Rápidas</Card.Title>
            <Card.Subtitle>Clique para fazer uma pergunta</Card.Subtitle>
          </Card.Header>

          <div className="space-y-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                disabled={isLoading}
                className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-warning-600 flex-shrink-0" />
                  <span>{question}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Dicas */}
        <Card>
          <Card.Header>
            <Card.Title>Dicas</Card.Title>
          </Card.Header>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <MessageCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <p>Seja específico em suas perguntas para respostas mais precisas</p>
            </div>
            <div className="flex items-start space-x-2">
              <BookOpen className="h-4 w-4 text-secondary-600 mt-0.5 flex-shrink-0" />
              <p>Mencione o contexto do que está estudando</p>
            </div>
            <div className="flex items-start space-x-2">
              <Sparkles className="h-4 w-4 text-warning-600 mt-0.5 flex-shrink-0" />
              <p>Peça exemplos práticos para melhor compreensão</p>
            </div>
          </div>
        </Card>

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
              onClick={() => onNavigate?.('learning')}
              leftIcon={<BookOpen className="h-4 w-4" />}
            >
              Continuar Estudando
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => onNavigate?.('resources')}
              leftIcon={<BookOpen className="h-4 w-4" />}
            >
              Ver Recursos
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
  );
};

export default TeacherPage;
