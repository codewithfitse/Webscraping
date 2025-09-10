import React from 'react';
import { motion } from 'framer-motion';
import { FaCrown, FaUser, FaClock, FaUsers, FaLayerGroup } from 'react-icons/fa';
import waitingImg from '../assets/waiting.png';

const Waiting = ({ gameState, currentPlayer, userInfo, onChooseGameType, isChoosingGameType }) => {
  const isHost = currentPlayer?.isHost;
  const playerCount = gameState?.players?.length || 0;
  const maxPlayers = gameState?.maxPlayers || 2;
  const betAmount = gameState?.betAmount || 0;
  const canChooseGameType = !isHost && gameState?.players?.length === 2 && !gameState?.gameType;

  // Debug logging
  console.log('=== WAITING COMPONENT DEBUG ===');
  console.log('gameState:', gameState);
  console.log('currentPlayer:', currentPlayer);
  console.log('userInfo:', userInfo);
  console.log('isHost:', isHost);
  console.log('playerCount:', playerCount);
  console.log('maxPlayers:', maxPlayers);
  console.log('gameType:', gameState?.gameType);
  console.log('canChooseGameType:', canChooseGameType);
  console.log('onChooseGameType function:', typeof onChooseGameType);
  console.log('isChoosingGameType:', isChoosingGameType);
  console.log('================================');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-900/95 to-purple-900/95 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full text-center shadow-2xl"
      >
        {/* Waiting Image */}
        <div className="flex justify-center mb-6">
          <img 
            src={waitingImg} 
            alt="Waiting" 
            className="w-24 h-24 object-contain opacity-80"
          />
        </div>

        {/* Host vs Player Content */}
        {isHost ? (
          <div className="space-y-4">
            {/* Host Crown */}
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-3 rounded-full">
                <FaCrown className="text-2xl text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              You're the Host!
            </h2>
            
            <p className="text-blue-200 text-sm leading-relaxed">
              Waiting for another player to join your game. 
              Share the game ID with a friend to start playing.
            </p>

            {/* Game Info for Host */}
            <div className="bg-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-200 text-sm">Game ID:</span>
                <span className="text-white font-mono text-sm bg-black/30 px-2 py-1 rounded">
                  {gameState?.gameId}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-200 text-sm">Bet Amount:</span>
                <span className="text-yellow-300 font-semibold">
                  {betAmount} ETB
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-200 text-sm">Players:</span>
                <span className="text-white">
                  {playerCount}/{maxPlayers}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Player Icon */}
            <div className="flex justify-center">
              <div className={`p-3 rounded-full ${
                canChooseGameType 
                  ? "bg-gradient-to-r from-blue-400 to-purple-600" 
                  : "bg-gradient-to-r from-green-400 to-green-600"
              }`}>
                {canChooseGameType ? (
                  <FaLayerGroup className="text-2xl text-white" />
                ) : (
                  <FaUser className="text-2xl text-white" />
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {canChooseGameType ? "Choose Game Mode" : "Waiting for Host"}
            </h2>
            
            <p className="text-green-200 text-sm leading-relaxed">
              {canChooseGameType 
                ? "You've joined the game! Choose a game mode to start playing."
                : "You've joined the game! Waiting for the host to start the game. Get ready to play some cards!"
              }
            </p>

            {/* Game Info for Player */}
            <div className="bg-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-green-200 text-sm">Host:</span>
                <span className="text-white font-semibold">
                  {gameState?.players?.find(p => p.isHost)?.username || 'Unknown'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-green-200 text-sm">Bet Amount:</span>
                <span className="text-yellow-300 font-semibold">
                  {betAmount} ETB
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-green-200 text-sm">Players:</span>
                <span className="text-white">
                  {playerCount}/{maxPlayers}
                </span>
              </div>
            </div>

            {/* Game Mode Selection for Non-Host Players */}
            {canChooseGameType && (
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-400/30">
                <h3 className="text-white font-semibold text-center mb-3">
                  Choose Game Mode
                </h3>
                <p className="text-green-200 text-xs text-center mb-4">
                  Select the game mode to start playing
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'UP_AND_DOWN', label: 'UP & DOWN', desc: 'Most popular' },
                    { value: 'UP', label: 'UP', desc: 'Simple mode' },
                    { value: 'DOWN', label: 'DOWN', desc: 'Master mode' },
                    { value: 'SIDE', label: 'SIDE', desc: 'Advanced mode' }
                  ].map((mode) => (
                                         <motion.button
                       key={mode.value}
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => {
                         console.log('=== BUTTON CLICK DEBUG ===');
                         console.log('Button clicked for mode:', mode.value);
                         console.log('onChooseGameType function:', onChooseGameType);
                         console.log('Function type:', typeof onChooseGameType);
                         console.log('isChoosingGameType:', isChoosingGameType);
                         
                         if (typeof onChooseGameType === 'function') {
                           console.log('Calling onChooseGameType with:', mode.value);
                           onChooseGameType(mode.value);
                         } else {
                           console.error('onChooseGameType is not a function!');
                           console.error('Value:', onChooseGameType);
                         }
                         console.log('==============================');
                       }}
                       disabled={isChoosingGameType}
                       className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-3 text-center transition-colors disabled:opacity-50"
                     >
                       <div className="text-white font-medium text-sm">{mode.label}</div>
                       <div className="text-white/60 text-xs">{mode.desc}</div>
                     </motion.button>
                  ))}
                </div>
                
                                 {isChoosingGameType && (
                   <div className="mt-3 text-center">
                     <div className="inline-flex items-center gap-2 text-green-300 text-sm">
                       <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin"></div>
                       Starting game...
                     </div>
                   </div>
                 )}

                 {/* Debug Button */}
                 <div className="mt-3 text-center">
                   <button
                     onClick={() => {
                       console.log('=== DEBUG BUTTON CLICK ===');
                       console.log('Testing onChooseGameType function');
                       console.log('Function:', onChooseGameType);
                       console.log('Type:', typeof onChooseGameType);
                       if (typeof onChooseGameType === 'function') {
                         console.log('Calling with test value');
                         onChooseGameType('UP');
                       }
                       console.log('============================');
                     }}
                     className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded border border-red-400/30 hover:bg-red-500/30"
                   >
                     Debug: Test Function
                   </button>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Animation */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              className="w-3 h-3 bg-blue-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              className="w-3 h-3 bg-purple-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              className="w-3 h-3 bg-pink-400 rounded-full"
            />
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <FaClock className="text-xs" />
            <span>
              {isHost 
                ? "Waiting for player to join..." 
                : canChooseGameType 
                  ? "Choose game mode to start..." 
                  : "Waiting for host to start..."
              }
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Waiting;
