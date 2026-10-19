import { useState } from 'react'
import { ACHIEVEMENTS, OBJECTIVES, RESOURCES, UNITS } from '../game/data'
import { formatNumber, formatRate } from '../game/format'
import type { GameApi } from '../game/useGame'
import type { GameState, ModalKind, ResourceKey } from '../game/types'
import { GameIcon } from './Icons'
import { Modal } from './Modal'

interface ModalHostProps {
  kind: ModalKind
  game: GameApi
  onClose: () => void
  onPlay: () => void
}

const WALLET_ORDER: ResourceKey[] = ['gold', 'bones', 'essence']

function ResourceRow({ state, keyName }: { state: GameState; keyName: ResourceKey }) {
  return (
    <div className="modal__row">
      <span>
        <GameIcon name={RESOURCES[keyName].sigil} size={15} /> {RESOURCES[keyName].label}
      </span>
      <span className={`amount amount--${keyName}`}>{formatNumber(state[keyName])}</span>
    </div>
  )
}

export function ModalHost({ kind, game, onClose, onPlay }: ModalHostProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  if (!kind) return null

  const { state } = game

  if (kind === 'settings') {
    return (
      <Modal title="Configurações" subtitle="Preferências desta partida" onClose={onClose}>
        <div className="modal__section">
          <p className="modal__label">Som</p>
          <div className="modal__row">
            <div>
              <strong>Estalo de conjuração</strong>
              <p>Som curto a cada conjuração no Cemitério.</p>
            </div>
            <button type="button" className="btn btn--small" onClick={game.toggleSound}>
              <GameIcon name={state.sound ? 'soundOn' : 'soundOff'} size={14} />
              {state.sound ? 'Ligado' : 'Desligado'}
            </button>
          </div>
          <div className="modal__row">
            <div>
              <strong>Salvar agora</strong>
              <p>O jogo salva automaticamente a cada 5 segundos.</p>
            </div>
            <button type="button" className="btn btn--small" onClick={game.saveNow}>
              <GameIcon name="save" size={14} />
              Salvar
            </button>
          </div>
        </div>

        <div className="modal__section">
          <p className="modal__label">Progresso</p>
          <div className="modal__row">
            <div>
              <strong>Redefinir jogo</strong>
              <p>Apaga criaturas, estações e melhorias. Não há volta.</p>
            </div>
            {confirmReset ? (
              <span className="modal__confirm">
                <button
                  type="button"
                  className="btn btn--small btn--danger"
                  onClick={() => {
                    game.reset()
                    onClose()
                  }}
                >
                  Confirmar
                </button>
                <button type="button" className="btn btn--small btn--ghost" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </button>
              </span>
            ) : (
              <button type="button" className="btn btn--small btn--danger" onClick={() => setConfirmReset(true)}>
                <GameIcon name="refresh" size={14} />
                Redefinir
              </button>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  if (kind === 'achievements') {
    const unlockedCount = ACHIEVEMENTS.filter((achievement) => achievement.unlocked(state)).length
    return (
      <Modal
        title="Conquistas"
        subtitle={`${unlockedCount} de ${ACHIEVEMENTS.length} desbloqueadas`}
        onClose={onClose}
      >
        <div className="achievement-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = achievement.unlocked(state)
            return (
              <div className={`achievement${unlocked ? '' : ' achievement--locked'}`} key={achievement.id}>
                <span className="sigil achievement__sigil">
                  <GameIcon name={unlocked ? 'trophy' : 'lock'} size={20} />
                </span>
                <span>
                  <span className="achievement__name">{achievement.name}</span>
                  <span className="achievement__desc">{achievement.description}</span>
                </span>
              </div>
            )
          })}
        </div>
      </Modal>
    )
  }

  if (kind === 'missions') {
    return (
      <Modal
        title="Missões"
        subtitle={`${state.objectivesDone} de ${OBJECTIVES.length} objetivos concluídos`}
        onClose={onClose}
      >
        <div className="mission-list">
          {OBJECTIVES.map((objective, index) => {
            const done = index < state.objectiveIndex
            const current = Math.min(objective.current(state), objective.target)
            return (
              <div className={`objective-card${done ? ' objective-card--done' : ''}`} key={objective.id}>
                <div className="objective-card__top">
                  <span>{objective.text}</span>
                  <span className="objective-card__reward">+{formatNumber(objective.reward)} ouro</span>
                </div>
                <div className="bar">
                  <div className="bar__fill" style={{ width: `${(current / objective.target) * 100}%` }} />
                </div>
                <span className="objective__progress">
                  {done ? 'Concluído' : `${formatNumber(current)}/${formatNumber(objective.target)}`}
                </span>
              </div>
            )
          })}
        </div>
      </Modal>
    )
  }

  if (kind === 'credits') {
    return (
      <Modal title="Créditos" subtitle="Necromante Inc. — v0.1.0" onClose={onClose}>
        <div className="modal__section">
          <p className="modal__label">Reino</p>
          <p className="credits-text">
            <strong>Necromante Inc.</strong> é um jogo incremental de cemitério. Conjure ossos no Cemitério, erga
            criaturas na Cripta, melhore as estações do vale e transforme ossos em um império de ouro e essência.
          </p>
        </div>
        <div className="modal__section">
          <p className="modal__label">Elenco</p>
          <p className="credits-text">
            {UNITS.map((unit) => unit.name).join(' · ')}
          </p>
        </div>
        <div className="modal__section">
          <p className="modal__label">Arte</p>
          <p className="credits-text">
            Ilustrações fornecidas pelo próprio jogador — o vale, o necromante e o castelo ao fundo.
          </p>
        </div>
        <div className="modal__section">
          <p className="modal__label">Estado atual</p>
          <ResourceRow state={state} keyName="gold" />
          <ResourceRow state={state} keyName="bones" />
          <ResourceRow state={state} keyName="essence" />
          <div className="modal__row">
            <span>Conjurações</span>
            <span className="amount">{formatNumber(state.clicks)}</span>
          </div>
          <div className="modal__row">
            <span>Renda total</span>
            <span className="amount amount--gold">
              {WALLET_ORDER.map((key) => formatRate(game.rates[key])).join(' · ')}
            </span>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Sair" subtitle="A lua se põe sobre o vale" onClose={onClose}>
      <div className="modal__section">
        <p className="credits-text">
          Seu progresso fica salvo neste navegador. Feche a aba quando quiser — os mortos continuam trabalhando
          enquanto você estiver fora.
        </p>
      </div>
      <button
        type="button"
        className="btn btn--block"
        onClick={() => {
          onClose()
          onPlay()
        }}
      >
        <GameIcon name="play" size={14} />
        Voltar ao jogo
      </button>
    </Modal>
  )
}
