import React from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen text-slate-800">
      {user ? <Dashboard /> : <Login />}
    </div>
  );
};

export default App;
