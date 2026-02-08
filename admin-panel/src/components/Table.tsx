import type { ReactNode } from 'react';

export function Table({ headings, rows }: { headings: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-shell" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            {headings.map((head) => (
              <th key={head}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, idy) => (
                <td key={idy}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
