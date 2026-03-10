'use client';

import { useState, useEffect } from 'react';
import { Activity, Scale, Utensils, Dumbbell, Menu, X, LogOut } from 'lucide-react';
import MeasurementTab from '@/components/MeasurementTab';
import MacroTab from '@/components/MacroTab';
import ExerciseTab from '@/components/ExerciseTab';

type User = {
  id: string;
  username: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('measurement');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('fitTrack_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setUser(data);
      localStorage.setItem('fitTrack_user', JSON.stringify(data));
    } catch (error: any) {
      alert('Login failed: ' + error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fitTrack_user');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-2xl mb-8">
            <Activity className="w-8 h-8" />
            <span>FitTrack Pro</span>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-70"
            >
              {isLoggingIn ? 'Logging in...' : 'Login / Register'}
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              If the username doesn&apos;t exist, a new account will be created automatically.
            </p>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'measurement', name: 'Measurements', icon: Scale },
    { id: 'macros', name: 'Macro Calories', icon: Utensils },
    { id: 'exercise', name: 'Exercise Tracking', icon: Dumbbell },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <Activity className="w-6 h-6" />
          <span>FitTrack Pro</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition duration-200 ease-in-out
        w-64 bg-white border-r border-gray-200 z-10 flex flex-col
      `}>
        <div className="hidden md:flex items-center gap-2 text-indigo-600 font-bold text-xl p-6 border-b border-gray-100">
          <Activity className="w-8 h-8" />
          <span>FitTrack Pro</span>
        </div>
        
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="text-sm text-gray-500">Logged in as</div>
          <div className="font-medium text-gray-900 truncate">{user.username}</div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.name}
          </h1>
          <p className="text-gray-500 mt-1">Record and track your daily progress.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          {activeTab === 'measurement' && <MeasurementTab userId={user.id} />}
          {activeTab === 'macros' && <MacroTab userId={user.id} />}
          {activeTab === 'exercise' && <ExerciseTab userId={user.id} />}
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
