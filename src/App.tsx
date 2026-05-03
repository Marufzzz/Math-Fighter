/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { UserProfile, AVATARS } from './types';
import Lobby from './components/Lobby';
import GameView from './components/GameView';
import CharacterSelect from './components/CharacterSelect';
import { Swords, Trophy, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docRef = doc(db, 'users', u.uid);
        unsubscribeProfile = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile({ uid: u.uid, ...snapshot.data() } as UserProfile);
            setShowProfileSetup(false);
          } else {
            setShowProfileSetup(true);
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
          setLoading(false);
        });
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Auth error", err);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);


  const handleProfileComplete = async (name: string, avatarId: string) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: name,
      avatarId: avatarId,
      totalWins: 0,
      totalMatches: 0,
      lastSeen: new Date().toISOString(),
      storyProgress: 0,
    };
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        avatarId: avatarId,
        totalWins: 0,
        totalMatches: 0,
        lastSeen: serverTimestamp(),
        storyProgress: 0,
      });
      setProfile(newProfile);
      setShowProfileSetup(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <p className="text-xl font-medium tracking-tight">Initializing Math Fighter...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg shadow-lg shadow-orange-900/20">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic">
              Math <span className="text-orange-500">Fighter</span>
            </h1>
          </div>

          {profile && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold tracking-tight">{profile.displayName}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                  Wins: {profile.totalWins}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-orange-500 overflow-hidden flex items-center justify-center text-xl shadow-inner">
                {AVATARS.find(a => a.id === profile.avatarId)?.icon || '👤'}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {showProfileSetup ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CharacterSelect onComplete={handleProfileComplete} />
            </motion.div>
          ) : activeMatchId ? (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameView 
                matchId={activeMatchId} 
                profile={profile!} 
                onQuit={() => setActiveMatchId(null)} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <Lobby 
                profile={profile!} 
                onMatchFound={(id) => setActiveMatchId(id)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="opacity-40 grayscale transition-all hover:grayscale-0 hover:opacity-100">
            <h2 className="text-sm uppercase tracking-widest font-bold mb-4 flex items-center gap-2 justify-center md:justify-start">
              <Trophy className="w-4 h-4" /> Global Leaderboard
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 max-w-full">
              {/* Leaderboard entries would go here */}
              <p className="text-xs font-mono italic">Syncing world records...</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Built for kids who love math & combat
            </p>
            <p className="text-[10px] text-slate-700 mt-2">
              © 2024 Math Fighter Online. All attacks are educational.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
