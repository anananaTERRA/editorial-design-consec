import { renderInlineText } from '../content/renderRuns'

type EditorialTableProps = {
  caption?: string
  columns: string[]
  rows: string[][]
}

export function EditorialTable({ caption = '', columns, rows }: EditorialTableProps) {
  if (columns.length === 0) {
    throw new Error(`EditorialTable "${caption}" needs columns`)
  }

  rows.forEach((row, index) => {
    if (row.length !== columns.length) {
      throw new Error(
        `EditorialTable "${caption}" row ${index + 1} has ${row.length} cells; expected ${columns.length}`,
      )
    }
  })

  return (
    <figure className="editorial-table">
      <table>
        {caption.trim() ? <caption>{renderInlineText(caption)}</caption> : null}
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`${column}-${index}`} scope="col">
                {renderInlineText(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{renderInlineText(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
