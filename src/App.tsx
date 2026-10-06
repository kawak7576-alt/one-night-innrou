/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { RoleConfigView } from './components/RoleConfigView';
import { NightView } from './components/NightView';
import { DayDiscussionView } from './components/DayDiscussionView';
import { VotingView } from './components/VotingView';
import { ExecutionView } from './components/ExecutionView';
import { ResultView } from './components/ResultView';
import { QRCodeModal } from './components/QRCodeModal';
import { RoleGuideModal } from './components/RoleGuideModal';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const {
    gameState,
    connectionStatus,
    errorMessage,
    clearError,
    getStoredPlayerName,
    joinRoom,
    startRoleConfig,
    setRoleConfig,
    startNight,
    submitNightAction,
    endDiscussion,
    submitVote,
    submitHunterRevenge,
    kickPlayer,
    newGame,
  } = useGameSocket();

  const [isQROpen, setIsQROpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const phase = gameState?.phase || 'LOBBY';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <Header
        roomId={gameState?.roomId}
        connectionStatus={connectionStatus}
        phase={gameState?.phase}
        onResetGame={newGame}
        onOpenQR={() => setIsQROpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="bg-rose-900/90 border-b border-rose-700 px-4 py-2 text-xs text-rose-100 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={clearError}
            className="px-2 py-0.5 bg-rose-800 rounded text-[10px] font-bold"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Main Game Screen depending on phase */}
      <main className="flex-1 flex flex-col">
        {(!gameState || phase === 'LOBBY') && (
          <LobbyView
            gameState={gameState}
            onJoinRoom={joinRoom}
            onStartRoleConfig={startRoleConfig}
            onOpenQR={() => setIsQROpen(true)}
            onKickPlayer={kickPlayer}
            savedName={getStoredPlayerName()}
          />
        )}

        {gameState && phase === 'ROLE_CONFIG' && (
          <RoleConfigView
            gameState={gameState}
            onSetRoleConfig={setRoleConfig}
            onStartNight={startNight}
            onBackToLobby={newGame}
          />
        )}

        {gameState && phase === 'NIGHT' && (
          <NightView
            gameState={gameState}
            onSubmitAction={submitNightAction}
          />
        )}

        {gameState && phase === 'DAY_DISCUSSION' && (
          <DayDiscussionView
            gameState={gameState}
            onEndDiscussion={endDiscussion}
          />
        )}

        {gameState && phase === 'VOTING' && (
          <VotingView
            gameState={gameState}
            onSubmitVote={submitVote}
          />
        )}

        {gameState && phase === 'EXECUTION' && (
          <ExecutionView
            gameState={gameState}
            onSubmitHunterRevenge={submitHunterRevenge}
          />
        )}

        {gameState && phase === 'RESULT' && (
          <ResultView
            gameState={gameState}
            onNewGame={newGame}
          />
        )}
      </main>

      {/* Modals */}
      {isQROpen && gameState?.roomId && (
        <QRCodeModal
          roomId={gameState.roomId}
          onClose={() => setIsQROpen(false)}
        />
      )}

      {isGuideOpen && (
        <RoleGuideModal onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
}
