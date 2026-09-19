import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
  const { login, register, error } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', phone: '', role: 'technician'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      navigate('/');
    } catch {
      // Error is set in context
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="bg-gradient-3" />
      </div>

      <div className="login-container">
        {/* Left Panel */}
        <div className="login-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <Wrench size={40} />
            </div>
            <h1>TextileCare Pro</h1>
            <p className="hero-subtitle">Intelligent Maintenance Management for Textile & Garment Industry</p>
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-dot" />
                Real-time machine monitoring
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                Smart specialist auto-assignment
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                Photo-based issue reporting
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                Analytics & downtime tracking
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="login-form-panel">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{isLogin ? 'Sign in to your maintenance dashboard' : 'Register a new account'}</p>
            </div>

            {error && (
              <div className="form-error">
                <Shield size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="input-group">
                    <label>Full Name</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input className="input-field" name="name" value={formData.name} onChange={onChange} placeholder="Enter your full name" required />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Phone</label>
                    <div className="input-with-icon">
                      <Phone size={18} />
                      <input className="input-field" name="phone" value={formData.phone} onChange={onChange} placeholder="+91-XXXXXXXXXX" />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Role</label>
                    <select className="select-field" name="role" value={formData.role} onChange={onChange}>
                      <option value="technician">Technician</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </>
              )}

              <div className="input-group">
                <label>Email</label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input className="input-field" type="email" name="email" value={formData.email} onChange={onChange} placeholder="Enter your email" required />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input className="input-field" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} placeholder="Enter your password" required />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary btn-lg login-btn" type="submit" disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="form-toggle">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={() => { setIsLogin(!isLogin); setFormData({ email: '', password: '', name: '', phone: '', role: 'technician' }); }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>

            {/* Demo Accounts */}
            {isLogin && (
              <div className="demo-accounts">
                <div className="demo-title">Quick Demo Login</div>
                <div className="demo-grid">
                  <button className="demo-btn admin" onClick={() => handleDemoLogin('admin@textilecare.com', 'admin123')}>
                    <Shield size={14} /> Admin
                  </button>
                  <button className="demo-btn supervisor" onClick={() => handleDemoLogin('supervisor1@textilecare.com', 'super123')}>
                    <User size={14} /> Supervisor
                  </button>
                  <button className="demo-btn technician" onClick={() => handleDemoLogin('tech1@textilecare.com', 'tech123')}>
                    <Wrench size={14} /> Technician
                  </button>
                  <button className="demo-btn manager" onClick={() => handleDemoLogin('manager@textilecare.com', 'manager123')}>
                    <User size={14} /> Manager
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          position: relative;
          overflow: hidden;
        }

        .login-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
        }

        .bg-gradient-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%);
          top: -200px;
          right: -100px;
          animation: float 20s ease-in-out infinite;
        }

        .bg-gradient-2 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%);
          bottom: -150px;
          left: -100px;
          animation: float 25s ease-in-out infinite reverse;
        }

        .bg-gradient-3 {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: float 30s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -30px); }
          50% { transform: translate(-20px, 20px); }
          75% { transform: translate(15px, 15px); }
        }

        .login-container {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 1000px;
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
          animation: fadeInUp 0.6s ease;
        }

        .login-hero {
          background: linear-gradient(135deg, var(--slate-900) 0%, var(--slate-800) 100%);
          padding: var(--space-12);
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .login-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(16,185,129,0.05) 100%);
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .hero-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, var(--primary-600), var(--emerald-600));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: var(--space-6);
        }

        .hero-content h1 {
          font-size: var(--font-4xl);
          font-weight: 800;
          background: linear-gradient(135deg, white, var(--primary-300));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-3);
        }

        .hero-subtitle {
          font-size: var(--font-base);
          color: var(--text-muted);
          margin-bottom: var(--space-8);
          line-height: 1.6;
        }

        .hero-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--font-sm);
          color: var(--text-secondary);
        }

        .feature-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--emerald-500);
          flex-shrink: 0;
        }

        .login-form-panel {
          padding: var(--space-12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-wrapper {
          width: 100%;
          max-width: 380px;
        }

        .form-header {
          margin-bottom: var(--space-8);
        }

        .form-header h2 {
          font-size: var(--font-2xl);
          font-weight: 800;
          margin-bottom: var(--space-2);
        }

        .form-header p {
          color: var(--text-muted);
          font-size: var(--font-sm);
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--red-400);
          font-size: var(--font-sm);
          margin-bottom: var(--space-4);
        }

        .input-group {
          margin-bottom: var(--space-4);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon > svg:first-child {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
          z-index: 1;
        }

        .input-with-icon .input-field {
          padding-left: 40px;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          color: var(--text-muted);
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-password:hover {
          color: var(--text-primary);
        }

        .login-btn {
          width: 100%;
          margin-top: var(--space-6);
        }

        .form-toggle {
          text-align: center;
          margin-top: var(--space-6);
          font-size: var(--font-sm);
          color: var(--text-muted);
        }

        .form-toggle button {
          color: var(--primary-400);
          font-weight: 600;
          margin-left: var(--space-1);
          transition: color var(--transition-fast);
        }

        .form-toggle button:hover {
          color: var(--primary-300);
        }

        .demo-accounts {
          margin-top: var(--space-6);
          padding-top: var(--space-6);
          border-top: 1px solid var(--border-default);
        }

        .demo-title {
          font-size: var(--font-xs);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          margin-bottom: var(--space-3);
          text-align: center;
        }

        .demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-2);
        }

        .demo-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--font-xs);
          font-weight: 600;
          border: 1px solid var(--border-default);
          transition: all var(--transition-fast);
        }

        .demo-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .demo-btn.admin { color: var(--primary-600); background: #eff6ff; border-color: #bfdbfe; }
        .demo-btn.admin:hover { background: #dbeafe; border-color: var(--primary-600); }
        .demo-btn.supervisor { color: var(--emerald-600); background: #ecfdf5; border-color: #a7f3d0; }
        .demo-btn.supervisor:hover { background: #d1fae5; border-color: var(--emerald-600); }
        .demo-btn.technician { color: var(--amber-600); background: #fffbeb; border-color: #fde68a; }
        .demo-btn.technician:hover { background: #fef3c7; border-color: var(--amber-600); }
        .demo-btn.manager { color: var(--purple-600); background: #faf5ff; border-color: #e9d5ff; }
        .demo-btn.manager:hover { background: #f3e8ff; border-color: var(--purple-600); }

        @media (max-width: 768px) {
          .login-container {
            grid-template-columns: 1fr;
          }
          .login-hero {
            display: none;
          }
          .login-form-panel {
            padding: var(--space-8) var(--space-6);
          }
        }
      `}</style>
    </div>
  );
}
