import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot,
  orderBy,
  limit,
  query
} from 'firebase/firestore';
import { UserProfile, PlayerState, AVATARS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Swords as SwordsIcon, Map, Lock, Play, ChevronRight, BookOpen, Sparkles, MessageCircle } from 'lucide-react';
import { MATHEMATICIANS, Mathematician } from '../constants/mathematicians';

interface LobbyProps {
  profile: UserProfile;
  onMatchFound: (matchId: string) => void;
}

export default function Lobby({ profile, onMatchFound }: LobbyProps) {
  const [selectedBoss, setSelectedBoss] = useState<Mathematician | null>(null);
  const [loading, setLoading] = useState(false);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const storyProgress = profile.storyProgress || 0;

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalWins', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopPlayers(players);
    }, () => {});
    return () => unsubscribe();
  }, []);

  const startBossFight = async (boss: Mathematician) => {
    setLoading(true);
    try {
      const playerState: PlayerState = {
        uid: profile.uid,
        displayName: profile.displayName,
        avatarId: profile.avatarId,
        hp: 100,
        maxHp: 100,
        lastAction: null,
        lastActionTime: Date.now()
      };

      const bossState: PlayerState = {
        uid: 'ai_bot',
        displayName: boss.name,
        avatarId: 'boss', // Special marker
        hp: boss.difficulty === 'hard' ? 150 : boss.difficulty === 'medium' ? 120 : 100,
        maxHp: boss.difficulty === 'hard' ? 150 : boss.difficulty === 'medium' ? 120 : 100,
        lastAction: null,
        lastActionTime: Date.now()
      };

      const docRef = await addDoc(collection(db, 'matches'), {
        status: 'active',
        players: { 
          [profile.uid]: playerState,
          'ai_bot': bossState
        },
        isAi: true,
        difficulty: boss.difficulty,
        bossId: boss.id, // Store which boss it is
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      onMatchFound(docRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'matches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
      {/* Left Col: Journey Map */}
      <div className="lg:col-span-2 space-y-6 md:space-y-8">
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-[2rem] md:rounded-[2.5rem] p-1 shadow-2xl border-4 border-white/5">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="relative z-10 p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="bg-indigo-500/20 p-2 rounded-lg flex-shrink-0">
                <Map className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                  The <span className="text-orange-500">Mathverse</span> Journey
                </h2>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Defeat legends to unlock ancient secrets</p>
              </div>
            </div>

            {/* Completion Hero */}
            {storyProgress >= MATHEMATICIANS.length && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8 md:mb-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
                  <Sparkles className="w-full h-full text-yellow-400" />
                </div>
                <Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                <h3 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter mb-2">The True Math Sage</h3>
                <p className="text-slate-200 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                  You have mastered the equations of the masters. From Pythagoras to Einstein, you've proven that logic is the ultimate power in the universe.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                   Status: Legend of the Mathverse
                </div>
              </motion.div>
            )}

            {/* Journey Timeline */}
            <div className="space-y-4 md:space-y-6 relative">
               {/* Vertical Line */}
               <div className="absolute left-6 md:left-8 top-10 bottom-10 w-1 bg-white/5 rounded-full" />
               
               {MATHEMATICIANS.map((boss, idx) => {
                 const isLocked = idx > storyProgress;
                 const isCurrent = idx === storyProgress;
                 const isBeaten = idx < storyProgress;

                 return (
                   <motion.div 
                    key={boss.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative flex items-center gap-4 md:gap-12 p-4 md:p-6 rounded-3xl transition-all duration-500
                      ${isCurrent ? 'bg-white/10 ring-2 ring-orange-500 shadow-2xl' : 'bg-transparent'}
                      ${isLocked ? 'opacity-40 grayscale' : 'opacity-100'}
                    `}
                   >
                     {/* Node */}
                     <div className={`relative z-20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-4xl shadow-xl flex-shrink-0
                        ${isCurrent ? 'bg-orange-500 ring-4 ring-orange-500/30' : isBeaten ? 'bg-indigo-500' : 'bg-slate-800'}
                     `}>
                       {isLocked ? <Lock className="w-5 h-5 md:w-6 md:h-6 text-slate-500" /> : boss.avatar}
                       
                       {isBeaten && (
                         <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-slate-900">
                            <Sparkles className="w-3 h-3 text-white" />
                         </div>
                       )}
                     </div>

                     <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 md:gap-3 mb-1">
                           <h3 className="text-base md:text-xl font-black italic text-white uppercase tracking-tight truncate">{boss.name}</h3>
                           <span className={`self-start text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest
                             ${boss.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' : boss.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}
                           `}>{boss.difficulty}</span>
                        </div>
                        <p className="text-slate-400 text-[10px] md:text-xs font-medium italic opacity-70 mb-3 md:mb-4">{boss.specialty}</p>
                        
                        {!isLocked && isCurrent && (
                          <button 
                            onClick={() => setSelectedBoss(boss)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 md:px-6 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                          >
                            <SwordsIcon className="w-3 h-3 md:w-4 md:h-4" /> Challenge
                          </button>
                        )}
                        {!isLocked && isBeaten && (
                          <button 
                             onClick={() => setSelectedBoss(boss)}
                             className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1"
                          >
                             Revisit History <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                     </div>
                   </motion.div>
                 );
               })}
            </div>
          </div>
        </section>

        {/* Global Stats or lore */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex items-center gap-4 md:gap-8">
            <div className="bg-orange-500/20 p-3 md:p-4 rounded-2xl flex-shrink-0">
               <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
            </div>
            <div>
               <h3 className="text-white text-sm md:text-base font-bold mb-1">The Librarian's Tip</h3>
               <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                 "Every legend you defeat brings you one step closer to the Eternal Calculus. Speed is your shield, logic is your sword."
               </p>
            </div>
        </div>
      </div>

      {/* Right Col: Leaderboard of Heroes */}
      <aside className="space-y-8">
        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-black uppercase tracking-tighter italic text-white underline decoration-orange-500 decoration-4 underline-offset-4">Top Sages</h2>
          </div>
          
          <div className="space-y-4">
            {topPlayers.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <span className={`italic font-black text-lg ${idx === 0 ? 'text-yellow-400' : 'text-slate-600'}`}>#{idx + 1}</span>
                  <div>
                    <p className="font-bold text-sm tracking-tight text-slate-200">{p.displayName}</p>
                    <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">Story lvl: {p.storyProgress || 0}</p>
                  </div>
                </div>
                <div className="text-2xl">
                  {AVATARS.find(a => a.id === p.avatarId)?.icon || '👤'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-white/10 rounded-[2rem] p-8 text-center">
            <Play className="w-8 h-8 text-orange-500 mx-auto mb-4" />
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Your Destiny</h3>
            <p className="text-2xl font-black mt-1 text-white">Journey Mode</p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono italic">Offline play supported in iFrame</p>
        </div>
      </aside>

      {/* Boss Intro Modal */}
      <AnimatePresence>
        {selectedBoss && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBoss(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-slate-900 border-2 border-white/10 rounded-[3.5rem] p-8 md:p-12 max-w-xl shadow-[0_0_100px_rgba(79,70,229,0.3)] overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div 
                className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none -mr-16 -mt-16"
                style={{ backgroundColor: selectedBoss.color, borderRadius: '50%', filter: 'blur(100px)' }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-orange-500 flex items-center justify-center text-6xl mb-6 shadow-2xl">
                   {selectedBoss.avatar}
                 </div>
                 
                 <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                   {selectedBoss.name}
                 </h2>
                 <p className="text-orange-500 text-[10px] font-black tracking-[0.3em] uppercase mb-8">
                   Master of {selectedBoss.specialty}
                 </p>
                 
                 <div className="relative bg-white/5 rounded-3xl p-6 italic text-slate-300 text-base mb-6 border border-white/5 w-full">
                    <MessageCircle className="absolute -top-3 -left-3 w-6 h-6 text-indigo-500 opacity-50" />
                    "{selectedBoss.intro}"
                 </div>

                 <div className="bg-indigo-500/10 rounded-2xl p-6 text-left mb-10 border border-indigo-500/20 w-full">
                    <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1">Historical Context</h4>
                    <p className="text-slate-400 text-xs leading-relaxed italic">
                      {selectedBoss.history}
                    </p>
                 </div>

                 <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => setSelectedBoss(null)}
                      className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
                    >
                      Maybe Later
                    </button>
                    <button 
                      disabled={loading}
                      onClick={() => startBossFight(selectedBoss)}
                      className="flex-[2] py-4 px-6 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-500 transition-all hover:scale-[1.02]"
                    >
                      {loading ? 'Preparing...' : 'Accept Challenge'}
                      <SwordsIcon className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

