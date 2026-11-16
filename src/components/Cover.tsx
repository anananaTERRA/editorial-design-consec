import type { EditorialDocument } from '../content/types'
import { ConsedLogo } from './ConsedLogo'

type CoverProps = {
  publication: Pick<EditorialDocument, 'title' | 'subtitle' | 'author'>
}

function CoverArt() {
  return (
    <div className="cover-art" aria-hidden="true">
      <svg viewBox="0 0 420 420" fill="none">
        <circle cx="300" cy="210" r="178" stroke="#0b5384" strokeWidth="2" opacity="0.18" />
        <path
          d="M300 32a178 178 0 0 1 0 356"
          stroke="#008ff1"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M300 68a142 142 0 0 0-123 213"
          stroke="#64e15e"
          strokeWidth="54"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M300 108a102 102 0 1 1-88 153"
          stroke="#3ec1d2"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="300" cy="210" r="62" fill="#fff" />
        <path
          d="M330 182a40 40 0 1 0 0 56"
          stroke="#0b5384"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="108" cy="330" r="26" fill="#c3e11d" />
        <circle cx="72" cy="252" r="12" fill="#edd62d" />
        <circle cx="376" cy="70" r="14" fill="#ff6f95" />
      </svg>
    </div>
  )
}

export function Cover({ publication }: CoverProps) {
  return (
    <div className="cover">
      <div className="cover-top">
        <div className="cover-brand">
          <span className="cover-brand-label">Realização</span>
          <ConsedLogo size={13} />
        </div>
        <div className="cover-brand cover-brand-right">
          <span className="cover-brand-label">Facilitação</span>
          <span className="cover-partner">Vozes da Educação</span>
        </div>
      </div>

      <div className="cover-mid">
        <div className="cover-copy">
          <p className="cover-eyebrow">Caderno de oficinas</p>
          <h1 className="cover-title">{publication.title}</h1>
          <p className="cover-subtitle">{publication.subtitle}</p>
        </div>
        <CoverArt />
      </div>

      <div className="cover-bottom">
        <div className="cover-rule" />
        <p className="cover-partners">
          <strong>Apoio</strong> Fundação Telefônica Vivo · Fundação Itaú · Itaú Social · FGV DGPE
        </p>
      </div>
    </div>
  )
}
