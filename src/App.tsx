import { useState } from 'react'
import { MainMenu } from './components/MainMenu'
import { GameScreen } from './components/GameScreen'
import { ModalHost } from './components/ModalHost'
import { useGame } from './game/useGame'
import type { ModalKind } from './game/types'

export default function App() {
  const game = useGame()
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  const [modal, setModal] = useState<ModalKind>(null)

  return (
    <div className="app">
      {screen === 'menu' ? (
        <MainMenu
          state={game.state}
          rates={game.rates}
          onPlay={() => setScreen('game')}
          onOpen={setModal}
        />
      ) : (
        <GameScreen game={game} onOpen={setModal} onMenu={() => setScreen('menu')} />
      )}

      <ModalHost
        key={modal ?? 'none'}
        kind={modal}
        game={game}
        onClose={() => setModal(null)}
        onPlay={() => setScreen('game')}
      />
    </div>
  )
}
