// src/pages/CommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, Globe } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { useNotification } from '../context/NotificationContext';
// import { communityAPI } from '../services/api'; // Descomentar quando a API estiver pronta

const CommunityPage = ({ onNavigate }) => {
  const { showInfo, showError } = useNotification();
  const [view, setView] = useState('teams'); // 'teams' ou 'mentors'
  const [teams, setTeams] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulação de dados da API
  const mockTeams = [
    { id: '1', name: 'Feras do Front-end', description: 'Foco em projetos de React e CSS avançado.', area: 'Tecnologia e Computação', member_count: 8, max_members: 10, is_private: false },
    { id: '2', name: 'Exploradores de IA', description: 'Estudando Machine Learning e Deep Learning.', area: 'Tecnologia e Computação', member_count: 5, max_members: 10, is_private: false },
    { id: '3', name: 'Designers Criativos', description: 'Projetos de UI/UX e Design Gráfico.', area: 'Artes e Cultura', member_count: 10, max_members: 10, is_private: true },
  ];

  const mockMentors = [
    { user_id: '101', display_name: 'Ana B.', bio: 'Engenheira de Software Sênior na Google.', areas: ['Tecnologia e Computação'], is_available: true },
    { user_id: '102', display_name: 'Dr. Carlos M.', bio: 'Ph.D. em Biologia e pesquisador.', areas: ['Ciências Biológicas e Saúde'], is_available: true },
    { user_id: '103', display_name: 'Sofia L.', bio: 'Empreendedora e fundadora de startup.', areas: ['Negócios e Empreendedorismo'], is_available: false },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // const [teamsData, mentorsData] = await Promise.all([
        //   communityAPI.getTeams(),
        //   communityAPI.getMentors(),
        // ]);
        // setTeams(teamsData.teams);
        // setMentors(mentorsData.mentors);
        
        // Usando dados mockados
        setTeams(mockTeams);
        setMentors(mockMentors);
      } catch (error) {
        showError('Erro ao carregar dados da comunidade.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoinTeam = (team) => {
    if (team.member_count >= team.max_members) {
      showError('Este time já está cheio.');
    } else {
      showInfo(`Pedido para entrar no time "${team.name}" enviado!`);
    }
  };

  const handleRequestMentorship = (mentor) => {
    if (!mentor.is_available) {
      showError('Este mentor não está disponível no momento.');
    } else {
      showInfo(`Pedido de mentoria para ${mentor.display_name} enviado!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-secondary-600 to-accent-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Comunidade</h1>
            <p className="text-indigo-100">Conecte-se, colabore e cresça com outros estudantes.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white p-1 rounded-lg shadow-sm">
        <Button variant={view === 'teams' ? 'primary' : 'ghost'} onClick={() => setView('teams')}>Times de Aprendizagem</Button>
        <Button variant={view === 'mentors' ? 'primary' : 'ghost'} onClick={() => setView('mentors')}>Encontrar Mentor</Button>
      </div>

      {loading ? (
        <Loading size="lg" text="Carregando comunidade..." />
      ) : (
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <div>
                <Card.Title>{view === 'teams' ? 'Times de Aprendizagem' : 'Mentores Disponíveis'}</Card.Title>
                <Card.Subtitle>{view === 'teams' ? 'Encontre um grupo com os mesmos interesses' : 'Receba orientação de usuários experientes'}</Card.Subtitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 border rounded-lg" />
              </div>
            </div>
          </Card.Header>
          
          <div className="space-y-4">
            {view === 'teams' && teams.map(team => (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{team.name}</h3>
                      {team.is_private ? <Shield className="h-4 w-4 text-gray-500" /> : <Globe className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                      <span>Área: {team.area}</span>
                      <span>{team.member_count}/{team.max_members} membros</span>
                    </div>
                  </div>
                  <Button onClick={() => handleJoinTeam(team)} leftIcon={<UserPlus className="h-4 w-4" />}>Entrar</Button>
                </div>
              </Card>
            ))}

            {view === 'mentors' && mentors.map(mentor => (
              <Card key={mentor.user_id} className="hover:shadow-md transition-shadow">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{mentor.display_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{mentor.bio}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mentor.areas.map(area => <span key={area} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{area}</span>)}
                    </div>
                  </div>
                  <Button onClick={() => handleRequestMentorship(mentor)} disabled={!mentor.is_available}>
                    {mentor.is_available ? 'Pedir Ajuda' : 'Indisponível'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CommunityPage;