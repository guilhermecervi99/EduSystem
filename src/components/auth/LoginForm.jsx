import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';

const LoginForm = ({ onSuccess }) => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erros quando o usuário começar a digitar
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validação básica
    if (!formData.username.trim()) {
      setLocalError('Email ou ID é obrigatório');
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setLocalError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setLocalError('Erro inesperado. Tente novamente.');
    }
  };

  const currentError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {currentError && (
        <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg">
          <p className="text-sm">{currentError}</p>
        </div>
      )}

      {/* Username/Email Field */}
      <Input
        label="Email ou ID do usuário"
        name="username"
        type="text"
        value={formData.username}
        onChange={handleChange}
        leftIcon={<Mail className="h-5 w-5" />}
        placeholder="Digite seu email ou ID"
        required
        disabled={isLoading}
        fullWidth
      />

      {/* Password Field */}
      <Input
        label="Senha"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        leftIcon={<Lock className="h-5 w-5" />}
        placeholder="Digite sua senha (opcional)"
        showPasswordToggle
        disabled={isLoading}
        fullWidth
        helperText="A senha é opcional. Você pode entrar apenas com email/ID."
      />

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        disabled={isLoading || !formData.username.trim()}
        size="lg"
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Dica: O sistema aceita login sem senha para facilitar o acesso
        </p>
      </div>
    </form>
  );
};

export default LoginForm;