import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const WelcomePage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Estados dos formulários
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hooks dos contextos
  const { login, register, error: authError, clearError } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  // ✅ CAPTURA GLOBAL DE ERROS
  useEffect(() => {
    const errorHandler = (e) => {
      console.error('🚨 ERRO GLOBAL CAPTURADO:', e.error);
      console.error('🚨 Stack:', e.error?.stack);
      // Salvar erro no localStorage para sobreviver ao reload
      localStorage.setItem('lastError', JSON.stringify({
        message: e.error?.message,
        stack: e.error?.stack,
        timestamp: new Date().toISOString()
      }));
    };

    const rejectionHandler = (e) => {
      console.error('🚨 PROMISE REJEITADA:', e.reason);
      localStorage.setItem('lastRejection', JSON.stringify({
        reason: e.reason?.toString(),
        timestamp: new Date().toISOString()
      }));
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Verificar se há erros anteriores
    const lastError = localStorage.getItem('lastError');
    if (lastError) {
      console.log('📋 Erro anterior encontrado:', JSON.parse(lastError));
      localStorage.removeItem('lastError');
    }

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  // Animação de entrada
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Limpar erros quando mudar de tela
  useEffect(() => {
    clearError();
    setErrors({});
  }, [showLogin, showRegister, clearError]);

  // ✅ FUNÇÃO DE LOGIN COM DEBUG EXTREMO
  const handleLoginSubmit = async (e) => {
    // Salvar logs no localStorage para sobreviver ao reload
    const saveLog = (message, data = {}) => {
      const logs = JSON.parse(localStorage.getItem('loginLogs') || '[]');
      logs.push({ 
        timestamp: new Date().toISOString(), 
        message, 
        data: JSON.stringify(data) 
      });
      localStorage.setItem('loginLogs', JSON.stringify(logs));
      console.log(message, data);
    };

    saveLog('🚨 handleLoginSubmit INICIADO!', { event: e.type });
    
    try {
      saveLog('🛑 Chamando preventDefault...');
      e.preventDefault();
      e.stopPropagation();
      saveLog('✅ preventDefault executado');
      
      saveLog('🔑 Dados de login:', { 
        email: loginData.email, 
        hasPassword: !!loginData.password 
      });
      
      // Verificar se função login existe
      if (typeof login !== 'function') {
        saveLog('❌ ERRO: login não é uma função!', { login: typeof login });
        throw new Error('Função login não está disponível');
      }
      
      saveLog('⏳ Definindo isLoading...');
      setIsLoading(true);
      setErrors({});
      
      saveLog('🚀 Chamando função login...');
      
      // Timeout para evitar travamento
      const loginPromise = login({
        username: loginData.email,
        password: loginData.password
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      );
      
      const result = await Promise.race([loginPromise, timeoutPromise]);
      
      saveLog('📦 Resultado recebido:', result);

      if (result && result.success) {
        saveLog('✅ Login bem-sucedido!');
        showSuccess(`Bem-vindo de volta!`);
      } else {
        saveLog('❌ Login falhou:', result);
        const errorMsg = result?.error || 'Erro desconhecido';
        setErrors({ login: errorMsg });
        showError(errorMsg);
      }
    } catch (error) {
      saveLog('💥 ERRO CAPTURADO:', { 
        message: error.message, 
        stack: error.stack 
      });
      setErrors({ login: error.message });
      showError(error.message);
    } finally {
      saveLog('🏁 Finalizando...');
      setIsLoading(false);
    }
    
    saveLog('🔚 handleLoginSubmit FINALIZADO');
  };

  // ✅ Verificar logs anteriores na inicialização
  useEffect(() => {
    const loginLogs = localStorage.getItem('loginLogs');
    if (loginLogs) {
      console.log('📋 LOGS ANTERIORES DE LOGIN:');
      JSON.parse(loginLogs).forEach(log => {
        console.log(`${log.timestamp}: ${log.message}`, log.data);
      });
      localStorage.removeItem('loginLogs'); // Limpar após mostrar
    }
  }, []);

  // ✅ CORREÇÃO: Register handler atualizado
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    console.log('📝 Tentando registrar usuário:', registerData.email);

    // Validações básicas
    if (registerData.password && registerData.password.length < 6) {
      setErrors({ register: 'A senha deve ter pelo menos 6 caracteres' });
      showError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password || '', // Senha opcional
        // Backend vai usar valores padrão para age e learning_style
      });

      if (result.success) {
        console.log('✅ Registro realizado com sucesso!');
        showSuccess(`Conta criada com sucesso! Bem-vindo!`);
        showInfo('Complete o mapeamento de interesses para personalizar sua experiência de aprendizado.');
        // O AuthContext vai redirecionar automaticamente
      } else {
        console.log('❌ Erro no registro:', result.error);
        setErrors({ register: result.error });
        showError(result.error);
      }
    } catch (error) {
      console.error('💥 Erro no registro:', error);
      const errorMessage = 'Erro inesperado. Tente novamente.';
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
    setRegisterData({ name: '', email: '', password: '' });
    clearError();
  };

  // Validação em tempo real
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background decorativo */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        animation: 'float 20s infinite linear',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '50px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        transform: isVisible ? 'translateY(0px)' : 'translateY(30px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.8s ease-out'
      }}>
        
        {!showLogin && !showRegister && (
          <>
            {/* Logo/Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px',
              fontSize: '35px',
              boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
              transform: isVisible ? 'scale(1)' : 'scale(0.8)',
              transition: 'transform 0.6s ease-out 0.2s'
            }}>
              🎓
            </div>
            
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '20px',
              letterSpacing: '-2px'
            }}>
              EduSystem
            </h1>
            
            <p style={{
              fontSize: '1.3rem',
              color: '#4a5568',
              marginBottom: '15px',
              fontWeight: '500'
            }}>
              Sistema Educacional Gamificado
            </p>
            
            <p style={{
              fontSize: '1.1rem',
              color: '#667eea',
              marginBottom: '50px',
              fontWeight: '600'
            }}>
              Aprenda de forma personalizada com IA 🚀
            </p>

            {/* Features Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '50px'
            }}>
              <div style={{
                padding: '25px',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <div style={{ fontSize: '30px', marginBottom: '15px' }}>🎯</div>
                <h3 style={{ color: '#2d3748', marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                  Mapeamento Inteligente
                </h3>
                <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Descubra suas áreas de interesse e receba trilhas personalizadas
                </p>
              </div>

              <div style={{
                padding: '25px',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(118, 75, 162, 0.2)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <div style={{ fontSize: '30px', marginBottom: '15px' }}>🏆</div>
                <h3 style={{ color: '#2d3748', marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                  Sistema de Conquistas
                </h3>
                <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Ganhe XP, badges e suba de nível conforme aprende
                </p>
              </div>

              <div style={{
                padding: '25px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '15px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                <div style={{ fontSize: '30px', marginBottom: '15px' }}>🤖</div>
                <h3 style={{ color: '#2d3748', marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                  Professor Virtual
                </h3>
                <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  IA avançada para tirar dúvidas e gerar conteúdo personalizado
                </p>
              </div>
            </div>
            
            <div style={{ 
              marginBottom: '40px',
              display: 'flex',
              flexDirection: window.innerWidth < 640 ? 'column' : 'row',
              gap: '15px',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setShowRegister(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '18px 35px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  minWidth: '200px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 25px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                }}
              >
                Começar Agora
              </button>
              
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#667eea',
                  padding: '18px 35px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '200px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#667eea';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#667eea';
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Já tenho conta
              </button>
            </div>

            {/* Call to action adicional */}
            <div style={{
              fontSize: '0.9rem',
              color: '#718096',
              fontStyle: 'italic'
            }}>
              🚀 Junte-se a milhares de estudantes que já descobriram sua paixão
            </div>
          </>
        )}

        {showLogin && (
          <div style={{
            maxWidth: '400px',
            margin: '0 auto',
            animation: 'slideIn 0.4s ease-out'
          }}>
            <form onSubmit={handleLoginSubmit}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                padding: '40px', 
                borderRadius: '20px',
                border: '1px solid rgba(251, 191, 36, 0.2)'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 25px',
                  fontSize: '25px'
                }}>
                  🔑
                </div>
                
                <h2 style={{ 
                  color: '#92400e', 
                  marginBottom: '15px',
                  fontSize: '1.8rem',
                  fontWeight: '700'
                }}>
                  Bem-vindo de volta!
                </h2>
                <p style={{ 
                  color: '#d97706', 
                  marginBottom: '30px',
                  fontSize: '1rem'
                }}>
                  Entre na sua conta para continuar sua jornada de aprendizado
                </p>

                {/* Erro de autenticação */}
                {(errors.login || authError) && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#dc2626',
                    fontSize: '0.9rem'
                  }}>
                    ❌ {errors.login || authError}
                  </div>
                )}

                {/* Email Field */}
                <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#92400e',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Email
                  </label>
                  <input 
                    type="email"
                    placeholder="test@test.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${!validateEmail(loginData.email) && loginData.email ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                      borderRadius: '10px',
                      fontSize: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      transition: 'border-color 0.3s ease',
                      opacity: isLoading ? 0.7 : 1
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#fbbf24'}
                    onBlur={(e) => e.target.style.borderColor = !validateEmail(loginData.email) && loginData.email ? 'rgba(239, 68, 68, 0.3)' : 'rgba(251, 191, 36, 0.3)'}
                  />
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: '30px', textAlign: 'left' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#92400e',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Senha (opcional)
                  </label>
                  <input 
                    type="password"
                    placeholder="test123"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      transition: 'border-color 0.3s ease',
                      opacity: isLoading ? 0.7 : 1
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#fbbf24'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)'}
                  />
                  <p style={{ color: '#d97706', fontSize: '0.8rem', marginTop: '4px' }}>
                    Use: test@test.com / test123
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !validateEmail(loginData.email)}
                  style={{
                    width: '100%',
                    background: (isLoading || !validateEmail(loginData.email)) ? '#d1d5db' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white',
                    padding: '15px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: (isLoading || !validateEmail(loginData.email)) ? 'not-allowed' : 'pointer',
                    marginBottom: '20px',
                    transition: 'transform 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
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
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: isLoading ? '#9ca3af' : '#d97706',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    transition: 'color 0.3s ease'
                  }}
                >
                  ← Voltar ao início
                </button>
              </div>
            </form>
          </div>
        )}

        {showRegister && (
          <div style={{
            maxWidth: '400px',
            margin: '0 auto',
            animation: 'slideIn 0.4s ease-out'
          }}>
            <form onSubmit={handleRegisterSubmit}>
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                padding: '40px', 
                borderRadius: '20px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 25px',
                  fontSize: '25px'
                }}>
                  📝
                </div>

                <h2 style={{ 
                  color: '#065f46', 
                  marginBottom: '15px',
                  fontSize: '1.8rem',
                  fontWeight: '700'
                }}>
                  Crie sua conta
                </h2>
                <p style={{ 
                  color: '#059669', 
                  marginBottom: '30px',
                  fontSize: '1rem'
                }}>
                  Comece sua jornada de aprendizado personalizado
                </p>

                {/* Erro de autenticação */}
                {(errors.register || authError) && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#dc2626',
                    fontSize: '0.9rem'
                  }}>
                    ❌ {errors.register || authError}
                  </div>
                )}

                {/* Email Field */}
                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#065f46',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Email *
                  </label>
                  <input 
                    type="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${!validateEmail(registerData.email) && registerData.email ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                      borderRadius: '10px',
                      fontSize: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      transition: 'border-color 0.3s ease',
                      opacity: isLoading ? 0.7 : 1
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                    onBlur={(e) => e.target.style.borderColor = !validateEmail(registerData.email) && registerData.email ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}
                  />
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: '30px', textAlign: 'left' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#065f46',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Senha (opcional)
                  </label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${registerData.password.length > 0 && registerData.password.length < 6 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                      borderRadius: '10px',
                      fontSize: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      transition: 'border-color 0.3s ease',
                      opacity: isLoading ? 0.7 : 1
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                    onBlur={(e) => e.target.style.borderColor = registerData.password.length > 0 && registerData.password.length < 6 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}
                  />
                  <p style={{ color: '#059669', fontSize: '0.8rem', marginTop: '4px' }}>
                    A senha é opcional. Se informada, deve ter pelo menos 6 caracteres
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !validateEmail(registerData.email) || (registerData.password && registerData.password.length < 6)}
                  style={{
                    width: '100%',
                    background: (isLoading || !validateEmail(registerData.email) || (registerData.password && registerData.password.length < 6)) ? '#d1d5db' : 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                    color: 'white',
                    padding: '15px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: (isLoading || !validateEmail(registerData.email) || (registerData.password && registerData.password.length < 6)) ? 'not-allowed' : 'pointer',
                    marginBottom: '20px',
                    transition: 'transform 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
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
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: isLoading ? '#9ca3af' : '#059669',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    transition: 'color 0.3s ease'
                  }}
                >
                  ← Voltar ao início
                </button>
              </div>
            </form>
          </div>
        )}
        
      </div>

      {/* CSS para animações */}
      <style>
        {`
          @keyframes float {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideIn {
            0% { 
              opacity: 0;
              transform: translateY(20px);
            }
            100% { 
              opacity: 1;
              transform: translateY(0px);
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          input:focus {
            outline: none;
          }
        `}
      </style>
    </div>
  );
};

export default WelcomePage;