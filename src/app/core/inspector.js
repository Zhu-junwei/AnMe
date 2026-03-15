export function createInspectorMethods({ constants, utils }) {
  return {
    inspectData(key, type) {
      const data = GM_getValue(key);
      if (!data) return;

      let content = null;
      if (type === 'cookies') content = data.cookies;
      if (type === 'localStorage') content = data.localStorage;
      if (type === 'sessionStorage') content = data.sessionStorage;
      if (!content) return;

      const inspectorWindow = window.open('', '_blank');
      if (!inspectorWindow) return;

      utils.setHTML(
        inspectorWindow.document.head,
        `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(constants.ICONS.LOGO)}">`
      );

      const noDataHtml = '<p>No data to display.</p>';
      const escapeHtml = (value) => {
        if (value === null || value === undefined) return '';
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };

      const createTable = (headers, dataRows, rowClasses = [], options = {}) => {
        const wrap = (cellContent, className = '') =>
          `<div class="cell-content${className ? ` ${className}` : ''}">${cellContent}</div>`;
        const extraClass = headers.length === 2 ? ' kv-table' : '';
        const columnWidths = options.columnWidths || headers.map(() => '');
        const cellClasses = options.cellClasses || headers.map(() => '');
        const colGroup = columnWidths.some(Boolean)
          ? `<colgroup>${columnWidths
              .map((width) => `<col${width ? ` style="width:${width}"` : ''}>`)
              .join('')}</colgroup>`
          : '';
        let table = `<div class="table-container${extraClass}"><table>`;
        table += colGroup;
        table += `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>`;
        table += '<tbody>';
        table += dataRows
          .map((row, index) => {
            const trClass = rowClasses[index] ? ` class="${rowClasses[index]}"` : '';
            return `<tr${trClass}>${row
              .map((cell, cellIndex) => {
                const cellValue = typeof cell === 'object' && cell !== null ? cell.value : cell;
                const cellClassName = [cellClasses[cellIndex], typeof cell === 'object' && cell !== null ? cell.className : '']
                  .filter(Boolean)
                  .join(' ');
                return `<td>${wrap(escapeHtml(cellValue), cellClassName)}</td>`;
              })
              .join('')}</tr>`;
          })
          .join('');
        table += '</tbody></table></div>';
        return table;
      };

      let inspectorHtml;
      if (type === 'cookies') {
        if (Array.isArray(content) && content.length > 0) {
          const originalHeaders = Object.keys(content[0]);
          const preferredOrder = ['name', 'value', 'expirationDate'];
          const headers = [
            ...preferredOrder,
            ...originalHeaders.filter((header) => !preferredOrder.includes(header) && header !== 'partitionKey')
          ];
          const rowClasses = content.map((cookie) => (cookie.httpOnly ? 'http-only' : ''));
          const dataRows = content.map((cookie) =>
            headers.map((header) => {
              const value = cookie[header];
              if (value === undefined || value === null) return '';
              if (header === 'expirationDate' && typeof value === 'number') {
                return {
                  value: new Date(value * 1000).toLocaleString(),
                  className: value * 1000 < Date.now() ? 'cell-expired' : ''
                };
              }
              return typeof value === 'object' ? JSON.stringify(value) : value;
            })
          );
          inspectorHtml = createTable(headers, dataRows, rowClasses, {
            columnWidths: headers.map((header) => {
              if (header === 'name') return '180px';
              if (header === 'value') return 'min(560px, 48vw)';
              if (header === 'expirationDate') return '180px';
              return '140px';
            }),
            cellClasses: headers.map((header) => (header === 'value' || header === 'domain' ? 'cell-break' : ''))
          });
        } else {
          inspectorHtml = noDataHtml;
        }
      } else if (typeof content === 'object' && Object.keys(content).length > 0) {
        inspectorHtml = createTable(['Key', 'Value'], Object.entries(content), [], {
          columnWidths: ['260px', 'auto'],
          cellClasses: ['', 'cell-break']
        });
      } else {
        inspectorHtml = noDataHtml;
      }

      inspectorWindow.document.title = 'AnMe Inspector';

      const style = inspectorWindow.document.createElement('style');
      style.textContent = `
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #f8f9fa; color: #212529; margin: 0; }
        h3 { color: #212529; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-top: 0; }
        .table-container { border: 1px solid #dee2e6; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: auto; max-height: 90vh; }
        table { width: 100%; min-width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #e9ecef; text-align: left; vertical-align: top; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; font-size: 13px; padding: 0; }
        .cell-content { display: block; width: 100%; min-width: 0; box-sizing: border-box; padding: 12px 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cell-break { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; text-overflow: clip; }
        .cell-expired { color: #d92d20; font-weight: 600; }
        th { background-color: #f1f3f5; font-weight: 600; position: sticky; top: 0; z-index: 10; text-align: center; padding: 12px 15px; white-space: nowrap; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr.http-only { background-color: #e2e6ea; border-bottom: 1px solid #d6d8db; }
        p { margin-top: 20px; }
      `;
      inspectorWindow.document.head.appendChild(style);
      utils.setHTML(inspectorWindow.document.body, `
        <h3>${utils.extractName(key)} - ${type}</h3>
        ${inspectorHtml}
      `);
    }
  };
}
