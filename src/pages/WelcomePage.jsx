import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const WelcomePage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  
  // Estados dos formulários
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    email: '', 
    password: '',
    age: '',
    learning_style: 'didático'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hooks dos contextos
  const { login, register, error: authError, clearError } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  // Animação de entrada
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Limpar erros quando mudar de tela
  useEffect(() => {
    clearError();
    setErrors({});
  }, [showLogin, showRegister, clearError]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStyleOptions && !event.target.closest('.style-select-container')) {
        setShowStyleOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStyleOptions]);

  // Função de login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const result = await login({
        username: loginData.email,
        password: loginData.password
      });

      if (result && result.success) {
        showSuccess(`Bem-vindo de volta!`);
      } else {
        const errorMsg = result?.error || 'Erro desconhecido';
        setErrors({ login: errorMsg });
        showError(errorMsg);
      }
    } catch (error) {
      setErrors({ login: error.message });
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validações
    if (!registerData.email || !validateEmail(registerData.email)) {
      setErrors({ register: 'Por favor, insira um email válido' });
      showError('Por favor, insira um email válido');
      setIsLoading(false);
      return;
    }

    if (!registerData.password || registerData.password.length < 6) {
      setErrors({ register: 'A senha deve ter pelo menos 6 caracteres' });
      showError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (!registerData.age || registerData.age < 10 || registerData.age > 100) {
      setErrors({ register: 'Por favor, insira uma idade válida' });
      showError('Por favor, insira uma idade válida');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password,
        age: parseInt(registerData.age),
        learning_style: registerData.learning_style
      });

      if (result.success) {
        showSuccess('Conta criada com sucesso! Bem-vindo!');
        showInfo('Redirecionando para o mapeamento de interesses...');
      } else {
        setErrors({ register: result.error });
        showError(result.error);
      }
    } catch (error) {
      const errorMessage = error.message || 'Erro inesperado. Tente novamente.';
      setErrors({ register: errorMessage });
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowLogin(false);
    setShowRegister(false);
    setErrors({});
    setLoginData({ email: '', password: '' });
    setRegisterData({ email: '', password: '', age: '', learning_style: 'didático' });
    clearError();
  };

  // Validação de email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Animated Circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      
      <div className={`max-w-4xl mx-auto relative z-10 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          
          {!showLogin && !showRegister && (
            <div className="text-center">
              {/* Logo */}
              <div className={`w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg transform transition-transform duration-500 ${isVisible ? 'scale-100' : 'scale-75'}`}>
                <span className="text-4xl">🎓</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                EduSystem
              </h1>
              
              <p className="text-xl text-gray-700 font-medium mb-2">
                Sistema Educacional Gamificado
              </p>
              
              <p className="text-lg text-purple-600 font-semibold mb-12">
                Aprenda de forma personalizada com IA 🚀
              </p>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="text-3xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Mapeamento Inteligente
                  </h3>
                  <p className="text-sm text-gray-600">
                    Descubra suas áreas de interesse e receba trilhas personalizadas
                  </p>
                </div>

                <div className="group p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="text-3xl mb-4">🏆</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Sistema de Conquistas
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ganhe XP, badges e suba de nível conforme aprende
                  </p>
                </div>

                <div className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="text-3xl mb-4">🤖</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Professor Virtual
                  </h3>
                  <p className="text-sm text-gray-600">
                    IA avançada para tirar dúvidas e gerar conteúdo personalizado
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-1 hover:scale-105"
                >
                  Começar Agora
                </button>
                
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transform transition-all duration-200 hover:-translate-y-1 hover:scale-105"
                >
                  Já tenho conta
                </button>
              </div>

              <p className="text-gray-600 italic">
                🚀 Junte-se a milhares de estudantes que já descobriram sua paixão
              </p>
            </div>
          )}

          {showLogin && (
            <div className="max-w-md mx-auto animate-fadeIn">
              <form onSubmit={handleLoginSubmit}>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-2xl">🔑</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
                    Bem-vindo de volta!
                  </h2>
                  <p className="text-amber-700 text-center mb-8">
                    Entre na sua conta para continuar sua jornada
                  </p>

                  {/* Erro */}
                  {(errors.login || authError) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
                      <span className="text-red-600">❌</span>
                      <p className="text-sm text-red-700">{errors.login || authError}</p>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Email
                    </label>
                    <input 
                      type="email"
                      placeholder="test@test.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                      disabled={isLoading}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                        !validateEmail(loginData.email) && loginData.email 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-amber-200 focus:border-amber-500'
                      } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  </div>

                  {/* Password Field */}
                  <div className="mb-8">
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Senha (opcional)
                    </label>
                    <input 
                      type="password"
                      placeholder="test123"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-amber-600 text-xs mt-1">
                      Use: test@test.com / test123
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !validateEmail(loginData.email)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isLoading || !validateEmail(loginData.email)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-full mt-4 py-3 text-amber-700 hover:text-amber-800 font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    ← Voltar ao início
                  </button>
                </div>
              </form>
            </div>
          )}

          {showRegister && (
            <div className="max-w-md mx-auto animate-fadeIn">
              <form onSubmit={handleRegisterSubmit}>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-2xl">📝</span>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
                    Crie sua conta
                  </h2>
                  <p className="text-green-700 text-center mb-8">
                    Comece sua jornada de aprendizado personalizado
                  </p>

                  {/* Erro */}
                  {(errors.register || authError) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
                      <span className="text-red-600">❌</span>
                      <p className="text-sm text-red-700">{errors.register || authError}</p>
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="mb-5">
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Email *
                    </label>
                    <input 
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                      disabled={isLoading}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                        !validateEmail(registerData.email) && registerData.email 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-green-200 focus:border-green-500'
                      } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  </div>

                  {/* Password Field */}
                  <div className="mb-5">
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Senha *
                    </label>
                    <input 
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                      disabled={isLoading}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                        registerData.password.length > 0 && registerData.password.length < 6
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-green-200 focus:border-green-500'
                      } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    {registerData.password && registerData.password.length < 6 && (
                      <p className="text-red-600 text-xs mt-1">
                        A senha deve ter pelo menos 6 caracteres
                      </p>
                    )}
                  </div>

                  {/* Age Field */}
                  <div className="mb-5">
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Idade *
                    </label>
                    <input 
                      type="number"
                      placeholder="14"
                      value={registerData.age}
                      onChange={(e) => setRegisterData({...registerData, age: parseInt(e.target.value) || ''})}
                      required
                      min="10"
                      max="100"
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-lg border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Learning Style Field - Custom Select */}
                  <div className="mb-8">
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Estilo de Aprendizado *
                    </label>
                    
                    {/* Custom Select */}
                    <div className="relative style-select-container">
                      <button
                        type="button"
                        onClick={() => setShowStyleOptions(!showStyleOptions)}
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-lg border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white text-left flex items-center justify-between"
                      >
                        <span className="capitalize">
                          {registerData.learning_style.charAt(0).toUpperCase() + registerData.learning_style.slice(1)}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showStyleOptions ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Options */}
                      {showStyleOptions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-green-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setRegisterData({...registerData, learning_style: 'didático'});
                                setShowStyleOptions(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150"
                            >
                              <div className="font-medium text-gray-900">Didático</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Explanações claras e estruturadas com exemplos práticos
                              </div>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setRegisterData({...registerData, learning_style: 'socrático'});
                                setShowStyleOptions(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150 border-t border-gray-100"
                            >
                              <div className="font-medium text-gray-900">Socrático</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Guiando através de perguntas para desenvolver o raciocínio crítico
                              </div>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setRegisterData({...registerData, learning_style: 'storytelling'});
                                setShowStyleOptions(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150 border-t border-gray-100"
                            >
                              <div className="font-medium text-gray-900">Storytelling</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Ensinando através de narrativas e casos contextualizados
                              </div>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setRegisterData({...registerData, learning_style: 'visual'});
                                setShowStyleOptions(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150 border-t border-gray-100"
                            >
                              <div className="font-medium text-gray-900">Visual</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Utilizando descrições de imagens, diagramas e representações visuais
                              </div>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setRegisterData({...registerData, learning_style: 'gamificado'});
                                setShowStyleOptions(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150 border-t border-gray-100"
                            >
                              <div className="font-medium text-gray-900">Gamificado</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Incorporando elementos de jogos, desafios e recompensas
                              </div>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setRegisterData({...registerData, learning_style: 'projeto'});
                                setShowStyleOptions(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-150 border-t border-gray-100"
                            >
                              <div className="font-medium text-gray-900">Projeto</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Aprendizado baseado em projetos práticos aplicáveis
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-green-600 text-xs mt-1">
                      Escolha como você prefere aprender
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !validateEmail(registerData.email) || registerData.password.length < 6 || !registerData.age}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isLoading || !validateEmail(registerData.email) || registerData.password.length < 6 || !registerData.age
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar conta'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="w-full mt-4 py-3 text-green-700 hover:text-green-800 font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    ← Voltar ao início
                  </button>
                </div>
              </form>
            </div>
          )}
          
        </div>
      </div>

      {/* CSS para animações customizadas */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;