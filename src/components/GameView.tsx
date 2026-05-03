import { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onSnapshot, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Match, PlayerState, UserProfile, AVATARS, MathProblem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Heart, Timer, Swords as SwordsIcon, ArrowLeft, Trophy, AlertCircle, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MATHEMATICIANS } from '../constants/mathematicians';

interface GameViewProps {
  matchId: string;
  profile: UserProfile;
  onQuit: () => void;
}

const Fighter = ({ 
  avatar, 
  isOpponent = false, 
  isDead = false, 
  actionType = null,
  isHit = false 
}: { 
  avatar: any; 
  isOpponent?: boolean; 
  isDead?: boolean; 
  actionType?: 'punch' | 'kick' | null; 
  isHit?: boolean;
}) => {
  return (
    <motion.div
      initial={false}
      animate={{
        x: actionType ? (isOpponent ? -80 : 80) : 0,
        rotate: isHit ? (isOpponent ? 20 : -20) : 0,
        scale: isDead ? 0.8 : 1,
        y: isDead ? 40 : 0,
        filter: isHit ? 'brightness(1.5) saturate(1.5)' : 'brightness(1) saturate(1)',
        opacity: isDead ? 0.5 : 1
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`relative flex flex-col items-center ${isOpponent ? 'scale-x-[-1]' : ''}`}
    >
      {/* Character Shadow */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute -bottom-4 w-24 h-4 bg-black/40 rounded-full blur-md" 
      />
      
      {/* Body Rig */}
      <div className="relative w-24 h-44">
        {/* Head */}
        <motion.div 
          animate={{ 
            y: [0, -4, 0],
            rotate: isHit ? (isOpponent ? 10 : -10) : 0 
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 text-8xl select-none z-40 drop-shadow-2xl"
        >
          {avatar?.icon || avatar}
        </motion.div>

        {/* Torso */}
        <motion.div 
          animate={{ y: [0, 2, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-24 rounded-3xl shadow-2xl z-20"
          style={{ backgroundColor: avatar?.color || '#555' }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10 rounded-3xl" />
        </motion.div>

        {/* Back Arm */}
        <motion.div 
          animate={{ rotate: actionType === 'punch' ? -60 : -10 }}
          className="absolute top-6 -left-6 w-7 h-18 rounded-full origin-top z-10"
          style={{ backgroundColor: avatar?.color || '#555', opacity: 0.7 }}
        />

        {/* Front Arm (Punching) */}
        <motion.div 
          animate={{ 
            rotate: actionType === 'punch' ? 100 : 20,
            x: actionType === 'punch' ? 15 : 0,
            y: actionType === 'punch' ? -10 : 0
          }}
          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
          className="absolute top-6 -right-6 w-8 h-20 rounded-full origin-top z-30 shadow-lg"
          style={{ backgroundColor: avatar?.color || '#555' }}
        >
          <div className="absolute bottom-0 left-0 w-10 h-10 rounded-full bg-slate-300 -ml-1 border-2 border-slate-400 shadow-inner" />
        </motion.div>

        {/* Legs */}
        <motion.div 
          animate={{ rotate: actionType === 'kick' ? -30 : 0 }}
          className="absolute bottom-0 left-2 w-9 h-14 rounded-full origin-top z-10" 
          style={{ backgroundColor: '#111' }} 
        />
        <motion.div 
          animate={{ 
            rotate: actionType === 'kick' ? 110 : 0,
            x: actionType === 'kick' ? 10 : 0 
          }}
          className="absolute bottom-0 right-2 w-10 h-16 rounded-full origin-top z-10 shadow-lg" 
          style={{ backgroundColor: '#111' }} 
        >
           <div className="absolute bottom-0 left-0 w-12 h-6 bg-slate-900 rounded-lg -ml-1 border-b-4 border-slate-950" />
        </motion.div>
      </div>

      {/* Hit FX */}
      <AnimatePresence>
        {isHit && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2, 0.5], opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            className="absolute top-0 z-50 pointer-events-none"
          >
            <Zap className="w-24 h-24 text-white fill-yellow-400 drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function GameView({ matchId, profile, onQuit }: GameViewProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [problem, setProblem] = useState<MathProblem>({ question: '...', answer: 0, difficulty: 1 });
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const [isAttacking, setIsAttacking] = useState<'punch' | 'kick' | null>(null);
  const [isMeHit, setIsMeHit] = useState(false);
  const [isOpponentHit, setIsOpponentHit] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [damagePopup, setDamagePopup] = useState<{ id: number, val: number, isMe: boolean }[]>([]);
  const [showStoryIntro, setShowStoryIntro] = useState(true);
  const [hasUpdatedStats, setHasUpdatedStats] = useState(false);
  
  const prevMeHp = useRef<number>(100);
  const prevOpHp = useRef<number>(100);
  const popupIdCounter = useRef(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'matches', matchId), (snapshot) => {
      const data = { id: snapshot.id, ...snapshot.data() } as Match;
      setMatch(data);

      const me = data.players[profile.uid];
      const opId = Object.keys(data.players).find(id => id !== profile.uid);
      const op = opId ? data.players[opId] : null;

      if (me && me.hp < prevMeHp.current) {
        const diff = prevMeHp.current - me.hp;
        triggerHit(true, diff);
      }
      if (op && op.hp < prevOpHp.current) {
        const diff = prevOpHp.current - op.hp;
        triggerHit(false, diff);
      }

      if (me) prevMeHp.current = me.hp;
      if (op) prevOpHp.current = op.hp;

      // Initialize first problem with match difficulty
      if (!problem.question || problem.question === '...') {
        setProblem(generateProblem(data.difficulty || 'easy'));
      }

      if (data.status === 'finished' && data.winner === profile.uid) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff4e00', '#ffffff', '#ffcc00']
        });
      }
    });

    return () => unsubscribe();
  }, [matchId, profile.uid]);

  const triggerHit = (isMe: boolean, val: number) => {
    if (isMe) {
      setIsMeHit(true);
      setTimeout(() => setIsMeHit(false), 300);
    } else {
      setIsOpponentHit(true);
      setTimeout(() => setIsOpponentHit(false), 300);
    }
    
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);

    const id = ++popupIdCounter.current;
    setDamagePopup(prev => [...prev, { id, val, isMe }]);
    setTimeout(() => {
      setDamagePopup(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  // AI Opponent Simulation Logic
  useEffect(() => {
    if (!match || match.status !== 'active' || !match.isAi || match.winner) return;

    const opponentId = 'ai_bot';
    const meId = profile.uid;
    const difficulty = match.difficulty || 'easy';

    const aiAttack = () => {
      const baseDelay = difficulty === 'easy' ? 6000 : difficulty === 'medium' ? 3000 : 1500;
      const randomJitter = Math.random() * 1000;
      
      const timer = setTimeout(async () => {
        // Fetch fresh state to check if game ended or someone left
        if (!match || match.status !== 'active' || match.winner) return;

        const damage = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;
        
        // IMPORTANT: Update using field paths to be atomic and avoid health-flips
        const updateObj: any = {
          [`players.${meId}.hp`]: increment(-damage),
          [`players.${opponentId}.lastAction`]: Math.random() > 0.5 ? 'kick' : 'punch',
          [`players.${opponentId}.lastActionTime`]: Date.now(),
          updatedAt: serverTimestamp()
        };

        try {
          await updateDoc(doc(db, 'matches', matchId), updateObj);
          
          if (match.players[meId].hp - damage <= 0) {
             await updateDoc(doc(db, 'matches', matchId), { 
               status: 'finished', 
               winner: opponentId 
             });
          }
        } catch (err) {
          console.error("AI write error", err);
        }
      }, baseDelay + randomJitter);

      return () => clearTimeout(timer);
    };

    return aiAttack();
  }, [match?.updatedAt, match?.status, match?.isAi, match?.winner]);

  function generateProblem(matchDifficulty: string = 'easy'): MathProblem {
    const ops = matchDifficulty === 'easy' ? ['+', '-'] : ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, ans;
    let diff = 1;

    const maxVal = matchDifficulty === 'easy' ? 25 : matchDifficulty === 'medium' ? 75 : 150;
    const midPoint = Math.floor(maxVal / 2);

    switch (op) {
      case '+':
        n1 = Math.floor(Math.random() * maxVal) + 1;
        n2 = Math.floor(Math.random() * maxVal) + 1;
        ans = n1 + n2;
        diff = ans > midPoint ? 2 : 1;
        break;
      case '-':
        n1 = Math.floor(Math.random() * maxVal) + midPoint;
        n2 = Math.floor(Math.random() * n1) + 1;
        ans = n1 - n2;
        diff = n1 > midPoint ? 2 : 1;
        break;
      case '*':
        n1 = Math.floor(Math.random() * (matchDifficulty === 'hard' ? 15 : 10)) + 2;
        n2 = Math.floor(Math.random() * (matchDifficulty === 'hard' ? 15 : 8)) + 2;
        ans = n1 * n2;
        diff = ans > 50 ? 3 : 2;
        break;
      case '/':
        ans = Math.floor(Math.random() * (matchDifficulty === 'easy' ? 8 : 15)) + 2;
        n2 = Math.floor(Math.random() * (matchDifficulty === 'easy' ? 8 : 15)) + 2;
        n1 = ans * n2;
        diff = n1 > midPoint ? 3 : 2;
        break;
      default:
        n1 = 1; n2 = 1; ans = 2;
    }

    return { question: `${n1} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${n2}`, answer: ans, difficulty: diff };
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!match || match.status !== 'active') return;

    const playerIds = Object.keys(match.players);
    const opponentId = playerIds.find(id => id !== profile.uid);

    if (!opponentId) return;

    if (parseInt(answer) === problem.answer) {
      // Correct! Attack opponent
      const action: 'punch' | 'kick' = Math.random() > 0.5 ? 'kick' : 'punch';
      setIsAttacking(action);
      setTimeout(() => setIsAttacking(null), 400);

      const damage = problem.difficulty * 8; 
      
      try {
        const opponentHp = match.players[opponentId].hp;
        const isGameOver = (opponentHp - damage) <= 0;
        
        const updateObj: any = {
          [`players.${opponentId}.hp`]: Math.max(0, opponentHp - damage),
          [`players.${profile.uid}.lastAction`]: action,
          [`players.${profile.uid}.lastActionTime`]: Date.now(),
          updatedAt: serverTimestamp()
        };

        if (isGameOver) {
          updateObj.status = 'finished';
          updateObj.winner = profile.uid;
        }

        await updateDoc(doc(db, 'matches', matchId), updateObj);

        // If game over, update user stats and story progress
        if (isGameOver && !hasUpdatedStats) {
          setHasUpdatedStats(true);
          const iWon = true; // If we're hitting the opponent and isGameOver is true, I won (CPU doesn't attack back in this simplified version yet)
          
          const userUpdate: any = {
            totalMatches: increment(1),
            lastSeen: serverTimestamp()
          };

          if (iWon) {
            userUpdate.totalWins = increment(1);
            const bossIdx = MATHEMATICIANS.findIndex(b => b.id === match.bossId);
            const currentProgress = profile.storyProgress || 0;
            
            // Only unlock next level if beating the CURRENT unlocked boss
            if (bossIdx === currentProgress && bossIdx < MATHEMATICIANS.length - 1) {
              userUpdate.storyProgress = bossIdx + 1;
            }
          }

          await updateDoc(doc(db, 'users', profile.uid), userUpdate);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `matches/${matchId}`);
      }

      setProblem(generateProblem(match.difficulty || 'easy'));
      setAnswer('');
      setError(false);
    } else {
      setError(true);
      setAnswer('');
      setTimeout(() => setError(false), 500);
    }
  };

  if (!match) return <div className="text-center py-20 animate-pulse font-mono tracking-widest uppercase text-white">Connecting to Dojo...</div>;

  const playerIds = Object.keys(match.players);
  const me = match.players[profile.uid];
  const opponentId = playerIds.find(id => id !== profile.uid);
  const opponent = opponentId ? match.players[opponentId] : null;

  const myAvatar = AVATARS.find(a => a.id === me.avatarId);
  const boss = match.bossId ? MATHEMATICIANS.find(b => b.id === match.bossId) : null;
  const opAvatar = boss ? { icon: boss.avatar, color: boss.color } : (opponent ? AVATARS.find(a => a.id === opponent.avatarId) : null);

  return (
    <div className="space-y-4 md:space-y-8 max-w-5xl mx-auto px-2 md:px-0 pb-10">
      <AnimatePresence>
        {boss && showStoryIntro && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
          >
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="max-w-2xl w-full max-h-[90vh] overflow-y-auto pr-4 custom-scrollbar"
             >
                <div className="flex flex-col items-center text-center py-8">
                   <div className="text-8xl mb-8 animate-bounce">{boss.avatar}</div>
                   <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter mb-2">Meeting {boss.name}</h2>
                   <p className="text-orange-500 font-black tracking-[0.3em] uppercase mb-10">Historical Encounter</p>
                   
                   <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-left mb-8 md:mb-10 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-20 opacity-5 -mr-10 -mt-10 bg-indigo-500 blur-3xl rounded-full" />
                      <p className="text-slate-300 text-base md:text-lg leading-relaxed italic relative z-10">
                        {boss.history}
                      </p>
                   </div>

                   <button 
                     onClick={() => setShowStoryIntro(false)}
                     className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-8 py-4 md:px-12 md:py-5 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
                   >
                     Begin the Duel
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Header */}
      <div className="flex justify-between items-center bg-black/40 border border-white/10 rounded-2xl p-3 md:p-6 backdrop-blur-xl sticky top-20 z-40">
         <button onClick={onQuit} className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
           <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
         </button>
         
         <div className="flex-1 flex justify-center items-center gap-4 md:gap-10">
            <div className="hidden sm:flex flex-col items-center">
               <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1 italic">Network Status</span>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold">STABLE</span>
               </div>
            </div>
            
            <div className="flex flex-col items-center">
               <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1 italic">Match Timer</span>
               <div className="flex items-center gap-2">
                  <Timer className="w-3 h-3 text-orange-500" />
                  <span className="text-xs font-mono font-bold">REAL-TIME</span>
               </div>
            </div>
         </div>

         <div className="bg-orange-600/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-orange-500/30">
            <span className="text-[10px] md:text-xs font-black italic uppercase tracking-tighter">
              {boss ? `${boss.name.toUpperCase()}` : `#${matchId.slice(-4)}`}
            </span>
         </div>
      </div>

      {/* Arena */}
      <motion.div 
        animate={screenShake ? {
          x: [0, -10, 10, -10, 10, 0],
          y: [0, 5, -5, 5, -5, 0]
        } : {}}
        transition={{ duration: 0.2 }}
        className="relative w-full aspect-video md:h-[400px] md:aspect-auto bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] border-4 border-white/5 shadow-2xl overflow-hidden group"
      >
         {/* Grid Background */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />

         {/* Floor */}
         <div className="absolute bottom-0 w-full h-8 md:h-24 bg-slate-800/50 border-t border-white/10 backdrop-blur-sm" />

         {/* Damage Popups */}
         <AnimatePresence>
            {damagePopup.map((popup) => (
              <motion.div
                key={popup.id}
                initial={{ opacity: 0, y: 100, x: popup.isMe ? '15%' : '65%' }}
                animate={{ opacity: 1, y: -50, x: popup.isMe ? '10%' : '70%' }}
                exit={{ opacity: 0, scale: 2 }}
                className="absolute z-50 pointer-events-none font-black text-2xl md:text-5xl italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                style={{ color: popup.isMe ? '#ff0000' : '#ffaa00' }}
              >
                -{popup.val}
              </motion.div>
            ))}
         </AnimatePresence>

         {/* Floating Math HUD */}
         <AnimatePresence>
           {match.status === 'active' && !match.winner && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.5, y: -50 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className="absolute top-2 md:top-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none"
             >
                <div className="bg-black/60 backdrop-blur-md border-2 border-orange-500/50 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-[0_0_30px_rgba(249,115,22,0.3)] min-w-[140px] md:min-w-[200px] text-center">
                   <div className="text-[7px] md:text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] mb-1 md:mb-2">Target Lock</div>
                   <div className="text-xl md:text-4xl font-black italic text-white font-mono tracking-tighter">
                     {problem.question}
                   </div>
                </div>
                <div className="w-1 h-4 md:h-12 bg-gradient-to-b from-orange-500/50 to-transparent" />
             </motion.div>
           )}
         </AnimatePresence>

         {/* Fighting Stage */}
         <div className="absolute inset-0 flex justify-between items-end px-4 md:px-12 pb-4 md:pb-20">
            {/* Player 1 (Me) */}
            <div className="relative flex flex-col items-center scale-[0.6] md:scale-100 origin-bottom">
               <div className="mb-2 md:mb-8 flex flex-col items-center w-32 md:w-40">
                  <span className="text-[10px] font-black uppercase text-white mb-1 md:mb-2 tracking-widest truncate max-w-full">{me.displayName}</span>
                  <div className="w-full h-3 bg-slate-950 rounded-full border border-white/10 overflow-hidden shadow-inner relative">
                     <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: `${Math.max(0, me.hp)}%` }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                        className={`h-full ${me.hp < 30 ? 'bg-red-500' : 'bg-orange-500'}`} 
                     />
                  </div>
               </div>
               
               <Fighter 
                 avatar={myAvatar} 
                 actionType={isAttacking} 
                 isHit={isMeHit} 
                 isDead={me.hp <= 0} 
               />
            </div>

            {/* VS Divider */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none scale-50 md:scale-150 text-white">
              <SwordsIcon className="w-32 h-32 md:w-48 md:h-48" />
            </div>

            {/* Player 2 (Opponent / Boss) */}
            {opponent ? (
              <div className="relative flex flex-col items-center scale-[0.6] md:scale-100 origin-bottom">
                 <div className="mb-2 md:mb-8 flex flex-col items-center w-32 md:w-40">
                    <span className="text-[10px] font-black uppercase text-white mb-1 md:mb-2 tracking-widest truncate max-w-full">{opponent.displayName}</span>
                    <div className="w-full h-3 bg-slate-950 rounded-full border border-white/10 overflow-hidden shadow-inner relative">
                       <motion.div 
                          initial={{ width: '100%' }}
                          animate={{ width: `${(opponent.hp / opponent.maxHp) * 100}%` }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                          className={`h-full ${opponent.hp < (opponent.maxHp * 0.3) ? 'bg-red-500' : 'bg-red-500'}`} 
                       />
                    </div>
                 </div>

                 <Fighter 
                   avatar={opAvatar} 
                   isOpponent 
                   actionType={opponent.lastActionTime && (Date.now() - opponent.lastActionTime < 500) ? (opponent.lastAction as any) : null} 
                   isHit={isOpponentHit} 
                   isDead={opponent.hp <= 0} 
                 />
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-30 animate-pulse text-white scale-50 md:scale-100">
                <div className="w-32 h-4 bg-slate-800 rounded-full mb-6" />
                <div className="text-8xl">👤</div>
                <p className="text-[10px] font-bold uppercase mt-4">Waiting for Target...</p>
              </div>
            )}
         </div>


         {/* Victory/Defeat Overlay */}
         <AnimatePresence>
            {match.status === 'finished' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                {match.winner === profile.uid ? (
                  <>
                    <motion.div 
                      key="win"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="bg-yellow-500 p-6 rounded-full mb-8 shadow-[0_0_50px_rgba(234,179,8,0.5)]"
                    >
                      <Trophy className="w-20 h-20 text-black" strokeWidth={3} />
                    </motion.div>
                    <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-2">Victory!</h2>
                    <p className="text-orange-400 text-xs md:text-sm font-bold uppercase tracking-[0.3em] mb-8">Legend Defeated</p>
                    
                    {boss && (
                      <div className="relative bg-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-sm mb-8 md:mb-12 border border-white/10 italic text-slate-300 text-sm md:text-base overflow-y-auto max-h-40 md:max-h-48 custom-scrollbar">
                        <MessageCircle className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 text-indigo-500" />
                        "{boss.defeatQuote}"
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div key="lose" className="bg-slate-800 p-4 md:p-6 rounded-full mb-6 md:mb-8">
                      <AlertCircle className="w-12 h-12 md:w-20 md:h-20 text-slate-400" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-2">Defeat</h2>
                    <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-[0.3em] mb-8">Try again, traveler</p>
                    
                    {boss && (
                      <div className="relative bg-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-sm mb-8 md:mb-12 border border-white/10 italic text-slate-400 text-sm md:text-base overflow-y-auto max-h-40 md:max-h-48 custom-scrollbar">
                        <MessageCircle className="absolute -top-3 -left-3 w-6 h-6 md:w-8 md:h-8 text-slate-600" />
                        "{boss.victoryQuote}"
                      </div>
                    )}
                  </>
                )}
                
                <button 
                  onClick={onQuit}
                  className="bg-white text-black px-8 py-3 md:px-12 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl text-sm md:text-base"
                >
                  Return to Journey
                </button>
              </motion.div>
            )}
         </AnimatePresence>
      </motion.div>

      {/* Input Area */}
      <AnimatePresence>
        {match.status === 'active' && !match.winner && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-full max-w-xs relative group px-4">
               <form onSubmit={handleSubmit} className="relative">
                  <input 
                    type="number"
                    inputMode="numeric"
                    autoFocus
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="RESULT"
                    className={`
                      w-full bg-slate-900 border-b-4 rounded-xl md:rounded-2xl p-4 md:p-6 text-2xl md:text-3xl text-center font-black outline-none transition-all
                      ${error ? 'border-red-500 text-red-500' : 'border-orange-500 text-white focus:ring-4 focus:ring-orange-500/10'}
                    `}
                  />
               </form>
               <div className="mt-2 md:mt-4 flex flex-col items-center gap-1 opacity-50">
                  <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-4">
                    Correct answers trigger combat sequences
                  </span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


const Swords = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="20" y2="20" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" y1="14" x2="9" y2="18" />
    <line x1="7" y1="17" x2="4" y2="20" />
    <line x1="3" y1="19" x2="4" y2="20" />
  </svg>
);
