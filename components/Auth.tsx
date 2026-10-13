
import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('dsavio83@gmail.com');
  const [name, setName] = useState('Dominic Savio');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      email: email
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-black text-white p-2 rounded-xl font-bold text-2xl">ST</div>
            <h1 className="text-2xl font-bold tracking-tight">SpellTamil</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your AI Tamil workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 ml-1">Password</label>
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 group"
            >
              Sign In
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-gray-300">
              <span className="bg-white px-4">Or continue with</span>
            </div>
          </div>

          <button className="w-full border border-gray-200 py-3.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
        
        <div className="p-6 bg-gray-50 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account? <span className="text-purple-600 font-bold cursor-pointer hover:underline">Create for free</span>
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-gray-400 text-xs font-medium">
        <Sparkles size={14} className="text-purple-500" />
        Powered by Advanced Tamil AI Reasoning
      </div>
    </div>
  );
};

export default Auth;
