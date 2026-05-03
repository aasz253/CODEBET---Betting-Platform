import { useState, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { logout, getCurrentUser } from '../services/authService';
import BetSlip from './BetSlip';
import PaymentModal from './PaymentModal';
import { useFetchBalance } from '../hooks/useAuth';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'deposit' | 'withdraw'>('deposit');
  const [showBetSlip, setShowBetSlip] = useState(false);
  const user = getCurrentUser();
  
  useFetchBalance();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
        setShowBetSlip(false);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#1A1A1A] border-b border-gray-800 p-4 flex justify-between items-center">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[#FFD700] text-2xl"
        >
          ☰
        </button>
        <a href="/" className="text-2xl font-bold text-[#FFD700]">CODEBET</a>
        <button
          onClick={() => setShowBetSlip(true)}
          className="bg-[#FFD700] text-black px-3 py-1 rounded font-bold text-sm"
        >
          Betslip
        </button>
      </div>

      {/* Sidebar - Mobile: Overlay, Desktop: Fixed */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:relative lg:inset-auto"
          onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 bg-[#1A1A1A] border-r border-gray-800 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <a href="/" className="text-2xl font-bold text-[#FFD700]">CODEBET</a>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-[#FFD700] text-2xl lg:hidden"
              >
                ×
              </button>
            </div>

            <h3 className="text-white font-bold mb-2">Sports</h3>
            {['Football', 'Basketball', 'Tennis', 'Hockey', 'Baseball', 'Volleyball'].map((sport) => (
              <div
                key={sport}
                className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded cursor-pointer text-gray-300 hover:text-white"
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                <span>{sport}</span>
              </div>
            ))}

            <h3 className="text-white font-bold mt-6 mb-2">Crash Games</h3>
            {[
              { name: 'Aviator', path: '/games/aviator' },
              { name: 'JetX', path: '/games/jetx' },
              { name: 'Aviatrix', path: '/games/aviatrix' },
              { name: 'Crash Comet', path: '/games/crash-comet' },
              { name: 'Goal Penalty', path: '/games/goal-penalty' },
            ].map((game) => (
              <a
                key={game.name}
                href={game.path}
                className="flex items-center space-x-2 p-2 hover:bg-gray-800 rounded cursor-pointer text-gray-300 hover:text-white"
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                <span>{game.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Navbar - Hidden on mobile */}
        <nav className="hidden lg:flex bg-[#1A1A1A] border-b border-gray-800 p-4 justify-between items-center">
          <a href="/" className="text-2xl font-bold text-[#FFD700]">CODEBET</a>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => { setPaymentType('deposit'); setShowPaymentModal(true); }}
              className="bg-[#00FF00] text-black px-4 py-2 rounded font-semibold hover:bg-[#00FF00]/90 transition"
            >
              Deposit
            </button>
            <div className="text-white">
              Balance: <span className="text-[#00FF00]">KES {useWalletStore((state) => state.balance).toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center text-black font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <button 
                onClick={() => { setPaymentType('withdraw'); setShowPaymentModal(true); }}
                className="text-gray-300 hover:text-white text-sm"
              >
                Withdraw
              </button>
              <a href="/settings" className="text-gray-300 hover:text-white text-sm">
                Settings
              </a>
              <a href="/referrals" className="text-gray-300 hover:text-white text-sm">
                Referrals
              </a>
              {user?.role === 'ADMIN' && (
                <a href="/admin" className="text-[#FFD700] hover:text-[#FFD700]/80 text-sm">
                  Admin
                </a>
              )}
              <button onClick={handleLogout} className="text-gray-300 hover:text-white">
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-gray-800 flex justify-around items-center p-3 z-40">
          <a href="/home" className="text-gray-300 hover:text-white text-xs text-center">
            <div className="text-xl">🏠</div>
            Home
          </a>
          <a href="/betting" className="text-gray-300 hover:text-white text-xs text-center">
            <div className="text-xl">🎮</div>
            Betting
          </a>
          <button
            onClick={() => setShowBetSlip(true)}
            className="text-gray-300 hover:text-white text-xs text-center"
          >
            <div className="text-xl">🎫</div>
            Betslip
          </button>
          <a href="/wallet" className="text-gray-300 hover:text-white text-xs text-center">
            <div className="text-xl">💰</div>
            Wallet
          </a>
          <a href="/settings" className="text-gray-300 hover:text-white text-xs text-center">
            <div className="text-xl">⚙️</div>
            Settings
          </a>
        </div>
      </div>

      {/* Betslip - Desktop: Sidebar, Mobile: Bottom Drawer */}
      <div className={`hidden lg:block ${showBetSlip ? 'block' : 'hidden'}`}>
        <BetSlip />
      </div>

      {/* Mobile Betslip Drawer */}
      {showBetSlip && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          onClick={() => setShowBetSlip(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#1A1A1A] p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Betslip</h3>
              <button
                onClick={() => setShowBetSlip(false)}
                className="text-[#FFD700] text-2xl"
              >
                ×
              </button>
            </div>
            <BetSlip />
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        type={paymentType}
      />
    </div>
  );
};

export default Layout;
