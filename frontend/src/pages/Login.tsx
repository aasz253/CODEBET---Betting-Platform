import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, setAuthData } from '../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser(formData);
      setAuthData(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1A1A1A] rounded-lg p-8 border border-gray-800">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-2">CODEBET</h1>
        <h2 className="text-xl text-white mb-6">Login</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-gray-700 rounded-md text-white focus:border-[#FFD700] focus:outline-none"
              placeholder="e.g. 0712345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0A0A0A] border border-gray-700 rounded-md text-white focus:border-[#FFD700] focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD700] text-black py-2 rounded-md font-semibold hover:bg-[#FFD700]/90 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#FFD700] hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
