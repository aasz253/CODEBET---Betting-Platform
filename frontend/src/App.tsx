import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Betting from './pages/Betting'
import Wallet from './pages/Wallet'
import HomePage from './pages/Homepage'
import BetHistory from './pages/BetHistory'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'
import AdminDashboard from './pages/admin/AdminDashboard'
import Aviator from './pages/games/Aviator'
import JetX from './pages/games/JetX'
import Aviatrix from './pages/games/Aviatrix'
import CrashComet from './pages/games/CrashComet'
import GoalPenalty from './pages/games/GoalPenalty'
import MatchDetails from './pages/MatchDetails'
import Referrals from './pages/Referrals'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/betting" element={<ProtectedRoute><Betting /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/bet-history" element={<ProtectedRoute><BetHistory /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/games/aviator" element={<ProtectedRoute><Aviator /></ProtectedRoute>} />
        <Route path="/games/jetx" element={<ProtectedRoute><JetX /></ProtectedRoute>} />
        <Route path="/games/aviatrix" element={<ProtectedRoute><Aviatrix /></ProtectedRoute>} />
        <Route path="/games/crash-comet" element={<ProtectedRoute><CrashComet /></ProtectedRoute>} />
        <Route path="/games/goal-penalty" element={<ProtectedRoute><GoalPenalty /></ProtectedRoute>} />
        <Route path="/match/:eventId" element={<ProtectedRoute><MatchDetails /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
