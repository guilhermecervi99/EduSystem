import React, { useState } from 'react';
import { Mail, Lock, User, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LEARNING_STYLES_LABELS } from '../../utils/constants';
import Button from '../common/Button';
import Input from '../common/Input';

const RegisterForm = ({ onSuccess }) => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    age: 14,
    learning_style: 'didático',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
    
    // Limpar erros quando o usuário começar a digitar
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validação
    if (formData.age < 10 || formData.age > 100) {
      setLocalError('Idade deve estar entre 10 e 100 anos');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      setLocalError('Email inválido');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setLocalError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const result = await register(formData);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setLocalError(result.error || 'Erro ao criar conta');
      }
    } catch (err) {
      setLocalError('Erro inesperado. Tente novamente.');
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

      {/* Email Field */}
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        leftIcon={<Mail className="h-5 w-5" />}
        placeholder="seu@email.com (opcional)"
        disabled={isLoading}
        fullWidth
        helperText="O email é opcional, mas recomendado para recuperar sua conta"
      />

      {/* Password Field */}
      <Input
        label="Senha"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        leftIcon={<Lock className="h-5 w-5" />}
        placeholder="Crie uma senha (opcional)"
        showPasswordToggle
        disabled={isLoading}
        fullWidth
        helperText="Senha opcional. Mínimo 6 caracteres se informada."
      />

      {/* Age Field */}
      <Input
        label="Idade"
        name="age"
        type="number"
        min="10"
        max="100"
        value={formData.age}
        onChange={handleChange}
        leftIcon={<Calendar className="h-5 w-5" />}
        disabled={isLoading}
        fullWidth
        required
        helperText="Usada para personalizar o conteúdo educacional"
      />

      {/* Learning Style Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estilo de Aprendizado Preferido
        </label>
        <select
          name="learning_style"
          value={formData.learning_style}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
          required
        >
          {Object.entries(LEARNING_STYLES_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Isso ajudará a personalizar como o conteúdo é apresentado
        </p>
      </div>

      {/* Learning Style Descriptions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Estilos de Aprendizado:
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Didático:</strong> Explicações claras e estruturadas</p>
          <p><strong>Socrático:</strong> Aprendizado através de perguntas</p>
          <p><strong>Storytelling:</strong> Conceitos através de histórias</p>
          <p><strong>Visual:</strong> Foco em descrições visuais</p>
          <p><strong>Gamificado:</strong> Elementos de jogos e desafios</p>
          <p><strong>Baseado em Projetos:</strong> Aprendizado prático</p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? 'Criando conta...' : 'Criar Conta'}
      </Button>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Ao criar uma conta, você concorda com nossos termos de uso
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;