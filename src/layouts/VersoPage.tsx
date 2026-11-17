import assinaturaVozes from '../assets/verso/vozes-assinatura-branca.svg'
import grafismoVozes from '../assets/verso/vozes-grafismo.png'

type VersoPageProps = {
  id: string
}

/**
 * Verso das Experiências — página roxa de fechamento.
 * A folha é fixa (`data-paginate="off"`): o paginador não corta a página.
 */
export function VersoPage({ id }: VersoPageProps) {
  return (
    <article
      id={id}
      className="sheet layout-verso"
      data-layout="verso"
      data-paginate="off"
      data-folio="off"
    >
      <div className="vs-page">
        <img className="vs-pattern" src={grafismoVozes} alt="" aria-hidden="true" />
        <span className="vs-veil" aria-hidden="true" />
        <img className="vs-logo" src={assinaturaVozes} alt="Vozes da educação" />
      </div>
    </article>
  )
}
