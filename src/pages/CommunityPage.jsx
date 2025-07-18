import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Shield, Globe, MessageCircle,
  Star, Award, Clock, Check, X, Send
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { useNotification } from '../context/NotificationContext';
import { communityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CommunityPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showInfo, showError, showSuccess } = useNotification();
  const [view, setView] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsData, mentorsData] = await Promise.all([
          communityAPI.getTeams(),
          communityAPI.getMentors()
        ]);
        setTeams(teamsData.teams || []);
        setMentors(mentorsData.mentors || []);
      } catch (error) {
        showError('Erro ao carregar dados da comunidade.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoinTeam = async (team) => {
    try {
      await communityAPI.joinTeam(team.id);
      showSuccess(`Você entrou no time "${team.name}"!`);
      
      // Atualizar lista
      const updatedTeams = teams.map(t => 
        t.id === team.id 
          ? { ...t, member_count: t.member_count + 1, members: [...(t.members || []), user.id] }
          : t
      );
      setTeams(updatedTeams);
    } catch (error) {
      showError(error.message || 'Erro ao entrar no time.');
    }
  };

  const handleCreateTeam = async (teamData) => {
    try {
      const newTeam = await communityAPI.createTeam(teamData);
      showSuccess('Time criado com sucesso!');
      setTeams([newTeam, ...teams]);
      setShowCreateTeamModal(false);
    } catch (error) {
      showError('Erro ao criar time.');
    }
  };

  const handleRequestMentorship = async (mentor, message) => {
    try {
      await communityAPI.requestMentorship(mentor.user_id, message);
      showSuccess(`Pedido de mentoria enviado para ${mentor.display_name}!`);
      setShowMentorshipModal(false);
    } catch (error) {
      showError(error.message || 'Erro ao solicitar mentoria.');
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMentors = mentors.filter(mentor =>
    mentor.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canBecomeMentor = user?.profile_level >= 10;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-secondary-600 to-accent-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Comunidade</h1>
              <p className="text-indigo-100">Conecte-se, colabore e cresça com outros estudantes.</p>
            </div>
          </div>
          
          {view === 'teams' && (
            <Button
              variant="accent"
              onClick={() => setShowCreateTeamModal(true)}
              leftIcon={<UserPlus className="h-5 w-5" />}
            >
              Criar Time
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center bg-white p-1 rounded-lg shadow-sm">
        <Button 
          variant={view === 'teams' ? 'primary' : 'ghost'} 
          onClick={() => setView('teams')}
        >
          Times de Aprendizagem
        </Button>
        <Button 
          variant={view === 'mentors' ? 'primary' : 'ghost'} 
          onClick={() => setView('mentors')}
        >
          Encontrar Mentor
        </Button>
      </div>

      {loading ? (
        <Loading size="lg" text="Carregando comunidade..." />
      ) : (
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <div>
                <Card.Title>
                  {view === 'teams' ? 'Times de Aprendizagem' : 'Mentores Disponíveis'}
                </Card.Title>
                <Card.Subtitle>
                  {view === 'teams' 
                    ? 'Encontre um grupo com os mesmos interesses' 
                    : 'Receba orientação de usuários experientes'
                  }
                </Card.Subtitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg" 
                />
              </div>
            </div>
          </Card.Header>
          
          <div className="space-y-4">
            {view === 'teams' && (
              <>
                {filteredTeams.length > 0 ? (
                  filteredTeams.map(team => (
                    <TeamCard 
                      key={team.id} 
                      team={team} 
                      onJoin={handleJoinTeam}
                      currentUserId={user?.id}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum time encontrado.</p>
                  </div>
                )}
              </>
            )}

            {view === 'mentors' && (
              <>
                {canBecomeMentor && !mentors.find(m => m.user_id === user?.id) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Torne-se um Mentor!</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Você tem o nível necessário para ajudar outros estudantes.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onNavigate?.('become-mentor')}
                      >
                        Tornar-se Mentor
                      </Button>
                    </div>
                  </div>
                )}
                
                {filteredMentors.length > 0 ? (
                  filteredMentors.map(mentor => (
                    <MentorCard 
                      key={mentor.user_id} 
                      mentor={mentor} 
                      onRequest={() => {
                        setSelectedMentor(mentor);
                        setShowMentorshipModal(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum mentor disponível no momento.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onCreate={handleCreateTeam}
        userArea={user?.current_track}
      />

      <MentorshipRequestModal
        isOpen={showMentorshipModal}
        onClose={() => setShowMentorshipModal(false)}
        mentor={selectedMentor}
        onRequest={handleRequestMentorship}
      />
    </div>
  );
};

// Componente TeamCard
const TeamCard = ({ team, onJoin, currentUserId }) => {
  const isMember = team.members?.includes(currentUserId);
  const isFull = team.member_count >= team.max_members;

  return (
    <Card hover className="transition-shadow">
      <div className="p-4 flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-lg">{team.name}</h3>
            {team.is_private ? (
              <Shield className="h-4 w-4 text-gray-500" title="Time Privado" />
            ) : (
              <Globe className="h-4 w-4 text-green-600" title="Time Público" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{team.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
            <span>Área: {team.area}</span>
            <span className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {team.member_count}/{team.max_members} membros
            </span>
            {team.chat_enabled && (
              <span className="flex items-center text-blue-600">
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat ativo
              </span>
            )}
          </div>
        </div>
        
        <Button 
          onClick={() => onJoin(team)} 
          disabled={isMember || isFull}
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          {isMember ? 'Já é membro' : isFull ? 'Time Cheio' : 'Entrar'}
        </Button>
      </div>
    </Card>
  );
};

// Componente MentorCard
const MentorCard = ({ mentor, onRequest }) => {
  return (
    <Card hover className="transition-shadow">
      <div className="p-4 flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
              {mentor.display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <span>{mentor.display_name}</span>
                <span className="text-sm text-gray-500">Nível {mentor.level}</span>
              </h3>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                {mentor.rating > 0 && (
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    {mentor.rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  {mentor.badges_count} badges
                </span>
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {mentor.mentees_count || 0} mentorados
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">{mentor.bio}</p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {mentor.areas.map((area, idx) => (
              <span 
                key={idx} 
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
        
        <Button 
          onClick={onRequest} 
          disabled={!mentor.is_available}
        >
          {mentor.is_available ? 'Pedir Ajuda' : 'Indisponível'}
        </Button>
      </div>
    </Card>
  );
};

// Modal de Criação de Time
const CreateTeamModal = ({ isOpen, onClose, onCreate, userArea }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    area: userArea || '',
    is_private: false,
    max_members: 10
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Time">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do Time"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ex: Feras do Frontend"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Descreva os objetivos e interesses do time..."
            required
          />
        </div>

        <Input
          label="Área de Estudo"
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          required
          placeholder="Ex: Tecnologia e Computação"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_private}
              onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Time Privado</span>
          </label>

          <div className="flex items-center space-x-2">
            <label className="text-sm">Máximo de membros:</label>
            <input
              type="number"
              min="2"
              max="20"
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
              className="w-16 px-2 py-1 border rounded"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Criar Time
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal de Solicitação de Mentoria
const MentorshipRequestModal = ({ isOpen, onClose, mentor, onRequest }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onRequest(mentor, message);
    setMessage('');
  };

  if (!isOpen || !mentor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Solicitar Mentoria de ${mentor.display_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Sobre o Mentor</h4>
          <p className="text-sm text-gray-600">{mentor.bio}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {mentor.areas.map((area, idx) => (
              <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {area}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sua mensagem
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Explique seus objetivos e no que precisa de ajuda..."
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" leftIcon={<Send className="h-4 w-4" />}>
            Enviar Solicitação
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CommunityPage;