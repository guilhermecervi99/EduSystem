
// pages/SettingsPage.jsx
import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Lock, 
  Eye, 
  Globe, 
  Palette, 
  Volume2, 
  Download,
  Trash2,
  Shield,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const SettingsPage = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useApp();
  const { showSuccess, showError, showInfo } = useNotification();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      achievements: true,
      progress: false,
      weekly_summary: true
    },
    privacy: {
      profile_visible: false,
      progress_visible: false,
      achievements_visible: true
    },
    preferences: {
      language: 'pt-BR',
      theme: theme || 'light',
      sound_effects: true,
      auto_save: true
    }
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    showInfo(`Configuração "${setting}" atualizada`);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    handleSettingChange('preferences', 'theme', newTheme);
    showSuccess(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout();
      showSuccess('Logout realizado com sucesso!');
    }
  };

  const exportData = () => {
    showInfo('Funcionalidade de exportação em desenvolvimento');
  };

  const deleteAccount = () => {
    if (window.confirm('ATENÇÃO: Esta ação é irreversível. Tem certeza que deseja excluir sua conta?')) {
      showError('Funcionalidade de exclusão em desenvolvimento');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-gray-100">
              Personalize sua experiência de aprendizado
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Notificações */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notificações</span>
            </Card.Title>
            <Card.Subtitle>Configure como receber alertas</Card.Subtitle>
          </Card.Header>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Notificações por Email</p>
                <p className="text-sm text-gray-600">Receber emails sobre atividades</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Conquistas</p>
                <p className="text-sm text-gray-600">Alertas sobre novas badges</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.achievements}
                  onChange={(e) => handleSettingChange('notifications', 'achievements', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Relatório Semanal</p>
                <p className="text-sm text-gray-600">Resumo do progresso semanal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.weekly_summary}
                  onChange={(e) => handleSettingChange('notifications', 'weekly_summary', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Privacidade */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Privacidade</span>
            </Card.Title>
            <Card.Subtitle>Controle a visibilidade dos seus dados</Card.Subtitle>
          </Card.Header>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Perfil Público</p>
                <p className="text-sm text-gray-600">Permitir que outros vejam seu perfil</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.profile_visible}
                  onChange={(e) => handleSettingChange('privacy', 'profile_visible', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Conquistas Visíveis</p>
                <p className="text-sm text-gray-600">Mostrar badges no ranking</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.achievements_visible}
                  onChange={(e) => handleSettingChange('privacy', 'achievements_visible', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Preferências */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Aparência e Preferências</span>
            </Card.Title>
            <Card.Subtitle>Personalize a interface</Card.Subtitle>
          </Card.Header>

          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900 mb-2">Tema</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    settings.preferences.theme === 'light'
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Claro
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    settings.preferences.theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Escuro
                </button>
                <button
                  onClick={() => handleThemeChange('auto')}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    settings.preferences.theme === 'auto'
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Automático
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Efeitos Sonoros</p>
                <p className="text-sm text-gray-600">Sons para ações e conquistas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preferences.sound_effects}
                  onChange={(e) => handleSettingChange('preferences', 'sound_effects', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Dados e Segurança */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Dados e Segurança</span>
            </Card.Title>
            <Card.Subtitle>Gerencie seus dados</Card.Subtitle>
          </Card.Header>

          <div className="space-y-3">
            <Button
              variant="outline"
              fullWidth
              onClick={exportData}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar Meus Dados
            </Button>

            <Button
              variant="outline"
              fullWidth
              onClick={() => onNavigate?.('profile')}
              leftIcon={<Lock className="h-4 w-4" />}
            >
              Alterar Senha
            </Button>

            <Button
              variant="outline"
              fullWidth
              onClick={handleLogout}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Sair da Conta
            </Button>

            <hr className="my-4" />

            <Button
              variant="outline"
              fullWidth
              onClick={deleteAccount}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              Excluir Conta
            </Button>
          </div>
        </Card>
      </div>

      {/* Ajuda e Suporte */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Ajuda e Suporte</span>
          </Card.Title>
        </Card.Header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            onClick={() => showInfo('Funcionalidade em desenvolvimento')}
          >
            FAQ
          </Button>
          <Button
            variant="outline"
            onClick={() => showInfo('Funcionalidade em desenvolvimento')}
          >
            Tutoriais
          </Button>
          <Button
            variant="outline"
            onClick={() => showInfo('Funcionalidade em desenvolvimento')}
          >
            Contato
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate?.('dashboard')}
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;