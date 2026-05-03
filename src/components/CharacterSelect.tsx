import React, { useState } from 'react';
import { AVATARS } from '../types';
import { motion } from 'motion/react';
import { Check, Shield, Zap, Sparkles } from 'lucide-react';

interface CharacterSelectProps {
  onComplete: (name: string, avatarId: string) => void;
}

export default function CharacterSelect({ onComplete }: CharacterSelectProps) {
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState(AVATARS[0].id);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (name.trim() && selectedId) {
      onComplete(name.trim(), selectedId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold tracking-tighter uppercase italic mb-4">
          Choose Your <span className="text-orange-500 underline decoration-4 underline-offset-8">Warrior</span>
        </h2>
        <p className="text-slate-400 font-medium">Enter your codename and select an avatar to enter the arena.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />
          
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">
                Fighter Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: MathWhiz123"
                maxLength={15}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:opacity-20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">
                Select Archetype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedId(avatar.id)}
                    className={`
                      relative group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300
                      ${selectedId === avatar.id 
                        ? 'bg-orange-500/10 border-2 border-orange-500 ring-4 ring-orange-500/10' 
                        : 'bg-black/20 border-2 border-white/5 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="text-4xl transform group-hover:scale-110 transition-transform">
                      {avatar.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedId === avatar.id ? 'text-orange-500' : 'text-slate-500'}`}>
                      {avatar.name}
                    </span>
                    {selectedId === avatar.id && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1 shadow-lg">
                        <Check className="w-3 h-3 text-white" strokeWidth={4} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-900/20 shadow-inner flex items-center justify-center gap-3 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!name.trim()}
        >
          Enter the Dojo
          <Zap className="w-5 h-5 group-hover:animate-pulse" />
        </motion.button>
      </form>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 opacity-40">
        <div className="flex flex-col items-center text-center gap-2">
          <Zap className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Fast Combat</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Secure Ranking</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Infinity Math</span>
        </div>
      </div>
    </div>
  );
}
