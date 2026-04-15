export function extractUserscriptMetadataValue(scriptMetaStr, fieldName) {
  const normalizedMetaStr = String(scriptMetaStr || '');
  const normalizedFieldName = String(fieldName || '').trim();
  if (!normalizedMetaStr || !normalizedFieldName) return '';

  const escapedFieldName = normalizedFieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = normalizedMetaStr.match(new RegExp(`^//\\s*@${escapedFieldName}\\s+(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

export function resolveScriptUpdatedAt(gmInfo = globalThis.GM_info) {
  const scriptMetaStr = typeof gmInfo?.scriptMetaStr === 'string' ? gmInfo.scriptMetaStr : '';
  const updatedFromHeader = extractUserscriptMetadataValue(scriptMetaStr, 'updated');
  if (updatedFromHeader) {
    return updatedFromHeader;
  }

  return typeof gmInfo?.script?.updated === 'string' ? gmInfo.script.updated.trim() : '';
}
