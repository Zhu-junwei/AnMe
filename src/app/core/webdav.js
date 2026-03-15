function encodeBasicAuth(username, password) {
  return `Basic ${btoa(unescape(encodeURIComponent(`${username}:${password}`)))}`;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const WEBDAV_PASSWORD_PREFIX = 'enc:v2:';

function createRandomHex(length = 32) {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

function toBinaryText(value) {
  return unescape(encodeURIComponent(String(value || '')));
}

function fromBinaryText(value) {
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return '';
  }
}

function xorBinaryText(sourceText, secret) {
  const source = String(sourceText || '');
  const key = toBinaryText(secret || 'anme-webdav') || 'anme-webdav';
  let masked = '';
  for (let index = 0; index < source.length; index += 1) {
    masked += String.fromCharCode(source.charCodeAt(index) ^ key.charCodeAt(index % key.length));
  }
  return masked;
}

function encryptWebDavPassword(password, secret) {
  const plainText = String(password || '');
  if (!plainText) return '';
  return `${WEBDAV_PASSWORD_PREFIX}${btoa(xorBinaryText(toBinaryText(plainText), secret))}`;
}

function decryptWebDavPassword(passwordCipher, secret) {
  const cipherText = String(passwordCipher || '');
  if (!cipherText) return '';
  if (!cipherText.startsWith(WEBDAV_PASSWORD_PREFIX)) return '';
  try {
    return fromBinaryText(xorBinaryText(atob(cipherText.slice(WEBDAV_PASSWORD_PREFIX.length)), secret));
  } catch {
    return '';
  }
}

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function normalizeDirectory(directory) {
  return String(directory || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function getManagedDirectory(constants) {
  return normalizeDirectory(
    `${String(constants.META.NAME || 'anme')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-webdav`
  );
}

function getBackupExtension(constants) {
  return '.anme';
}

function withManagedDirectory(config, constants) {
  return {
    ...config,
    directory: getManagedDirectory(constants)
  };
}

function joinRemoteUrl(remoteUrl, fileName) {
  return `${remoteUrl.replace(/\/+$/, '')}/${encodeURIComponent(fileName)}`;
}

function getManifestName() {
  return '.anme-index.json';
}

function getRemoteBackupName(_config, _constants, displayName) {
  return displayName;
}

function toRemoteUrl(config) {
  const baseUrl = normalizeBaseUrl(config.url);
  const directory = normalizeDirectory(config.directory);
  return directory ? `${baseUrl}/${directory}` : baseUrl;
}

function isBackupArchiveFile(fileName, constants) {
  const normalizedName = String(fileName || '').toLowerCase();
  return normalizedName.endsWith('.zip') || normalizedName.endsWith(getBackupExtension(constants));
}

function isGzipData(bytes) {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function isZipData(bytes) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

async function readStreamToUint8Array(stream) {
  const response = new Response(stream);
  return new Uint8Array(await response.arrayBuffer());
}

async function gzipBytes(bytes) {
  if (typeof CompressionStream === 'undefined') {
    return bytes;
  }
  return readStreamToUint8Array(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));
}

async function gunzipBytes(bytes, utils) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error(utils.t('sync_restore_err'));
  }
  return readStreamToUint8Array(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')));
}

async function encodeBackupPayload(exportObj, constants) {
  const payload = {
    format: 'anme-webdav-v2',
    meta: {
      name: constants.META.NAME,
      version: constants.META.VERSION,
      exportedAt: new Date().toISOString()
    },
    backup: exportObj
  };
  return gzipBytes(textEncoder.encode(JSON.stringify(payload)));
}

async function decodeBackupPayload(arrayBuffer, utils) {
  const bytes = new Uint8Array(arrayBuffer);
  if (isZipData(bytes)) {
    throw new Error(utils.t('sync_restore_err'));
  }

  const rawBytes = isGzipData(bytes) ? await gunzipBytes(bytes, utils) : bytes;
  const parsed = JSON.parse(textDecoder.decode(rawBytes));
  return parsed && typeof parsed === 'object' && parsed.backup ? parsed.backup : parsed;
}

function parseWebDavList(xmlText, baseUrl, constants) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const responses = [...doc.getElementsByTagNameNS('*', 'response')];
  const basePath = new URL(baseUrl).pathname.replace(/\/+$/, '');

  return responses
    .map((response) => {
      const href = response.getElementsByTagNameNS('*', 'href')[0]?.textContent || '';
      const prop = response.getElementsByTagNameNS('*', 'prop')[0];
      const resourcetype = prop?.getElementsByTagNameNS('*', 'resourcetype')[0];
      const isCollection = Boolean(resourcetype?.getElementsByTagNameNS('*', 'collection')[0]);
      const lastModified = prop?.getElementsByTagNameNS('*', 'getlastmodified')[0]?.textContent || '';
      const contentLength = prop?.getElementsByTagNameNS('*', 'getcontentlength')[0]?.textContent || '0';
      const hrefUrl = href ? new URL(href, baseUrl) : null;
      const pathname = hrefUrl?.pathname.replace(/\/+$/, '') || '';
      const fileName = hrefUrl ? decodeURIComponent(pathname.split('/').pop() || '') : '';

      return {
        pathname,
        fileName,
        isCollection,
        lastModified,
        size: Number(contentLength) || 0
      };
    })
    .filter((item) => item.fileName && item.pathname !== basePath && !item.isCollection && isBackupArchiveFile(item.fileName, constants))
    .sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0));
}

export function createWebDavMethods({ constants, utils, getUI, getCore }) {
  const getOrCreateWebDavSecret = () => {
    const existingSecret = String(GM_getValue(constants.CFG.WEBDAV_SECRET, '') || '');
    if (existingSecret) {
      return existingSecret;
    }
    const nextSecret = createRandomHex(32);
    GM_setValue(constants.CFG.WEBDAV_SECRET, nextSecret);
    return nextSecret;
  };

  const request = (config, { method = 'GET', url, headers = {}, data, responseType = 'text', fetch = false }) =>
    new Promise((resolve, reject) => {
      let settled = false;
      let timedOut = false;
      let timeoutTimer = null;
      const finish = (handler) => (payload) => {
        if (settled) return;
        settled = true;
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        handler(payload);
      };
      const requestOptions = {
        method,
        url,
        fetch,
        responseType,
        headers: {
          Authorization: encodeBasicAuth(config.username, config.password),
          ...headers
        },
        onload: finish((response) => {
          if (response.status >= 200 && response.status < 300) {
            resolve(response);
            return;
          }
          reject(new Error(`${method} ${url} failed with ${response.status}`));
        }),
        onerror: finish(() =>
          reject(new Error(timedOut ? utils.t('webdav_timeout') : `${method} ${url} failed`))
        )
      };
      if (data !== undefined && data !== null) {
        requestOptions.data = data;
      }
      const xhr = GM_xmlhttpRequest(requestOptions);
      timeoutTimer = setTimeout(() => {
        timedOut = true;
        try {
          xhr?.abort?.();
        } catch {}
        finish(() => reject(new Error(utils.t('webdav_timeout'))))();
      }, 5000);
    });

  return {
    getCachedWebDavBackups() {
      const backups = GM_getValue(constants.CFG.WEBDAV_BACKUPS_CACHE, []);
      return Array.isArray(backups) ? backups : [];
    },
    saveCachedWebDavBackups(backups) {
      const normalizedBackups = Array.isArray(backups)
        ? backups.map((item) => ({
            fileName: String(item.fileName || ''),
            remoteFileName: String(item.remoteFileName || item.fileName || ''),
            lastModified: String(item.lastModified || ''),
            size: Number(item.size) || 0
          }))
        : [];
      GM_setValue(constants.CFG.WEBDAV_BACKUPS_CACHE, normalizedBackups);
      return normalizedBackups;
    },
    getWebDavConfig() {
      const config = GM_getValue(constants.CFG.WEBDAV_CONFIG, {});
      const secret = getOrCreateWebDavSecret();
      const password = decryptWebDavPassword(String(config.passwordCipher || ''), secret);
      return {
        url: String(config.url || ''),
        username: String(config.username || ''),
        password,
        directory: getManagedDirectory(constants)
      };
    },
    saveWebDavConfig(config) {
      const normalizedConfig = withManagedDirectory(config, constants);
      const password = String(normalizedConfig.password || '');
      GM_setValue(constants.CFG.WEBDAV_CONFIG, {
        url: normalizeBaseUrl(normalizedConfig.url),
        username: String(normalizedConfig.username || '').trim(),
        passwordCipher: encryptWebDavPassword(password, getOrCreateWebDavSecret())
      });
    },
    clearWebDavConfig() {
      GM_deleteValue(constants.CFG.WEBDAV_CONFIG);
      GM_deleteValue(constants.CFG.WEBDAV_SECRET);
      GM_deleteValue(constants.CFG.WEBDAV_BACKUPS_CACHE);
    },
    hasWebDavConfig() {
      const config = this.getWebDavConfig();
      return Boolean(config.url && config.username && config.password);
    },
    async verifyWriteAccess(config) {
      const remoteUrl = toRemoteUrl(config);
      const tempFileName = `.anme-webdav-check-${Date.now()}.tmp`;
      const tempFileUrl = joinRemoteUrl(remoteUrl, tempFileName);

      const uploadTempFile = async () =>
        request(config, {
          method: 'PUT',
          url: tempFileUrl,
          data: 'anme-webdav-check',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          }
        });

      if (!config.directory) {
        await uploadTempFile();
      } else {
        try {
          await uploadTempFile();
        } catch (uploadError) {
          try {
            await request(config, {
              method: 'MKCOL',
              url: remoteUrl
            });
          } catch {
            // Some servers do not support MKCOL but may still accept nested PUT after the first miss.
          }

          try {
            await uploadTempFile();
          } catch (retryError) {
            throw retryError || uploadError;
          }
        }
      }

      try {
        await request(config, {
          method: 'DELETE',
          url: tempFileUrl
        });
      } catch {
        // Ignore cleanup failure. Write access has already been verified.
      }

      return remoteUrl;
    },
    async readWebDavDirectory(config) {
      const remoteUrl = toRemoteUrl(config);
      const response = await request(config, {
        method: 'PROPFIND',
        url: remoteUrl,
        headers: {
          Depth: '1'
        }
      });
      return parseWebDavList(response.responseText || '', remoteUrl, constants).map((item) => ({
        fileName: item.fileName,
        remoteFileName: item.fileName,
        lastModified: item.lastModified ? new Date(item.lastModified).toISOString() : '',
        size: item.size
      }));
    },
    async readWebDavIndex(config) {
      const remoteUrl = toRemoteUrl(config);
      const manifestName = getManifestName();
      try {
        const response = await request(config, {
          method: 'GET',
          url: joinRemoteUrl(remoteUrl, manifestName),
          responseType: 'text'
        });
        const parsed = JSON.parse(response.responseText || '{}');
        return Array.isArray(parsed.backups) ? parsed.backups : [];
      } catch (error) {
        if (/ 404$/.test(error.message)) {
          return [];
        }
        throw error;
      }
    },
    async writeWebDavIndex(config, backups) {
      const remoteUrl = toRemoteUrl(config);
      const manifestName = getManifestName();
      await request(config, {
        method: 'PUT',
        url: joinRemoteUrl(remoteUrl, manifestName),
        data: JSON.stringify({ backups }, null, 2),
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        }
      });
    },
    normalizeWebDavConfig(config) {
      return withManagedDirectory({
        url: normalizeBaseUrl(config.url),
        username: String(config.username || '').trim(),
        password: String(config.password || '')
      }, constants);
    },
    async validateWebDavConfig(config) {
      const normalizedConfig = this.normalizeWebDavConfig(config);
      if (!normalizedConfig.url || !normalizedConfig.username || !normalizedConfig.password) {
        throw new Error(utils.t('webdav_missing_config'));
      }

      await this.verifyWriteAccess(normalizedConfig);
      await this.readWebDavIndex(normalizedConfig);
      return normalizedConfig;
    },
    async getValidatedWebDavConfig() {
      return this.validateWebDavConfig(this.getWebDavConfig());
    },
    async listWebDavBackups() {
      const config = await this.getValidatedWebDavConfig();
      let backups = await this.readWebDavIndex(config);
      if (!backups.length) {
        backups = await this.readWebDavDirectory(config);
      }
      backups = backups.sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0));
      return this.saveCachedWebDavBackups(backups);
    },
    async uploadWebDavBackup() {
      const config = await this.getValidatedWebDavConfig();
      const core = getCore();
      const exportObj = core.buildExportObject('all');
      if (!exportObj) {
        await getUI().alert(utils.t('export_err'));
        return null;
      }

      const remoteUrl = toRemoteUrl(config);
      const archiveBytes = await encodeBackupPayload(exportObj, constants);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${constants.META.NAME}_Sync_${timestamp}${getBackupExtension(constants)}`;
      const remoteFileName = getRemoteBackupName(config, constants, fileName);
      await request(config, {
        method: 'PUT',
        url: joinRemoteUrl(remoteUrl, remoteFileName),
        data: archiveBytes.buffer,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      const backups = await this.readWebDavIndex(config);
      backups.unshift({
        fileName,
        remoteFileName,
        lastModified: new Date().toISOString(),
        size: archiveBytes.byteLength
      });
      await this.writeWebDavIndex(config, backups);
      this.saveCachedWebDavBackups(backups);

      return fileName;
    },
    async restoreWebDavBackup(fileName) {
      const config = await this.getValidatedWebDavConfig();
      const remoteUrl = toRemoteUrl(config);
      let backups = await this.readWebDavIndex(config);
      if (!backups.length) {
        backups = await this.readWebDavDirectory(config);
      }
      const matchedBackup = backups.find((item) => item.fileName === fileName);
      const remoteFileName = matchedBackup?.remoteFileName || getRemoteBackupName(config, constants, fileName);
      const response = await request(config, {
        method: 'GET',
        url: joinRemoteUrl(remoteUrl, remoteFileName),
        responseType: 'arraybuffer',
        fetch: true,
        headers: {
          Accept: 'application/octet-stream',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-store'
        }
      });
      const backupData = await decodeBackupPayload(response.response, utils);
      const result = getCore().importBackupObject(backupData, 'sync');
      getUI().refresh();
      return result;
    },
    async deleteWebDavBackup(fileName) {
      const config = await this.getValidatedWebDavConfig();
      const remoteUrl = toRemoteUrl(config);
      let backups = await this.readWebDavIndex(config);
      if (!backups.length) {
        backups = await this.readWebDavDirectory(config);
      }
      const matchedBackup = backups.find((item) => item.fileName === fileName);
      const remoteFileName = matchedBackup?.remoteFileName || getRemoteBackupName(config, constants, fileName);
      await request(config, {
        method: 'DELETE',
        url: joinRemoteUrl(remoteUrl, remoteFileName)
      });

      const nextBackups = backups.filter((item) => item.fileName !== fileName);
      await this.writeWebDavIndex(config, nextBackups);
      this.saveCachedWebDavBackups(nextBackups);
    }
  };
}
