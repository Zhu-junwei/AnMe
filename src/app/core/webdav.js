function encodeBasicAuth(username, password) {
  return `Basic ${btoa(unescape(encodeURIComponent(`${username}:${password}`)))}`;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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
    directory: getManagedDirectory(constants),
    storageMode: 'directory'
  };
}

function withFlatNamespace(config) {
  return {
    ...config,
    directory: '',
    storageMode: 'flat'
  };
}

function joinRemoteUrl(remoteUrl, fileName) {
  return `${remoteUrl.replace(/\/+$/, '')}/${encodeURIComponent(fileName)}`;
}

function getNamespacePrefix(constants) {
  return `${String(constants.META.NAME || 'anme')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}-webdav`;
}

function normalizeStorageMode(storageMode) {
  return storageMode === 'flat' ? 'flat' : 'directory';
}

function getManifestName(config, constants) {
  return normalizeStorageMode(config.storageMode) === 'flat'
    ? `${getNamespacePrefix(constants)}.index.json`
    : '.anme-index.json';
}

function getRemoteBackupName(config, constants, displayName) {
  return normalizeStorageMode(config.storageMode) === 'flat'
    ? `${getNamespacePrefix(constants)}__${displayName}`
    : displayName;
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
  const request = (config, { method = 'GET', url, headers = {}, data, responseType = 'text', fetch = false }) =>
    new Promise((resolve, reject) => {
      let settled = false;
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
        onerror: finish(() => reject(new Error(`${method} ${url} failed`)))
      };
      if (data !== undefined && data !== null) {
        requestOptions.data = data;
      }
      const xhr = GM_xmlhttpRequest(requestOptions);
      timeoutTimer = setTimeout(() => {
        try {
          xhr?.abort?.();
        } catch {}
        finish(() => reject(new Error(utils.t('webdav_timeout'))))();
      }, 10000);
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
      return {
        url: String(config.url || ''),
        username: String(config.username || ''),
        password: String(config.password || ''),
        directory:
          normalizeStorageMode(config.storageMode) === 'flat'
            ? ''
            : typeof config.directory === 'string'
              ? config.directory
              : getManagedDirectory(constants),
        storageMode: normalizeStorageMode(config.storageMode)
      };
    },
    saveWebDavConfig(config) {
      const normalizedConfig =
        normalizeStorageMode(config.storageMode) === 'flat'
          ? withFlatNamespace(config)
          : withManagedDirectory(config, constants);
      GM_setValue(constants.CFG.WEBDAV_CONFIG, {
        url: normalizeBaseUrl(normalizedConfig.url),
        username: String(normalizedConfig.username || '').trim(),
        password: String(normalizedConfig.password || ''),
        storageMode: normalizedConfig.storageMode
      });
    },
    clearWebDavConfig() {
      GM_deleteValue(constants.CFG.WEBDAV_CONFIG);
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
        fileName:
          normalizeStorageMode(config.storageMode) === 'flat'
            ? item.fileName.replace(new RegExp(`^${getNamespacePrefix(constants)}__`), '')
            : item.fileName,
        remoteFileName: item.fileName,
        lastModified: item.lastModified ? new Date(item.lastModified).toISOString() : '',
        size: item.size
      }));
    },
    async readWebDavIndex(config) {
      const remoteUrl = toRemoteUrl(config);
      const manifestName = getManifestName(config, constants);
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
      const manifestName = getManifestName(config, constants);
      await request(config, {
        method: 'PUT',
        url: joinRemoteUrl(remoteUrl, manifestName),
        data: JSON.stringify({ backups }, null, 2),
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        }
      });
    },
    async validateWebDavConfig(config) {
      const baseConfig = {
        url: normalizeBaseUrl(config.url),
        username: String(config.username || '').trim(),
        password: String(config.password || ''),
        storageMode: normalizeStorageMode(config.storageMode)
      };
      if (!baseConfig.url || !baseConfig.username || !baseConfig.password) {
        throw new Error(utils.t('webdav_missing_config'));
      }

      const candidateConfigs = [withManagedDirectory(baseConfig, constants), withFlatNamespace(baseConfig)];
      let firstError = null;

      for (const candidate of candidateConfigs) {
        try {
          await this.verifyWriteAccess(candidate);
          await this.readWebDavIndex(candidate);
          this.saveWebDavConfig(candidate);
          return candidate;
        } catch (error) {
          if (!firstError) {
            firstError = error;
          }
        }
      }

      throw firstError || new Error(utils.t('webdav_verify_err'));
    },
    async listWebDavBackups() {
      const config = await this.validateWebDavConfig(this.getWebDavConfig());
      let backups = await this.readWebDavIndex(config);
      if (!backups.length) {
        backups = await this.readWebDavDirectory(config);
      }
      backups = backups.sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0));
      return this.saveCachedWebDavBackups(backups);
    },
    async uploadWebDavBackup() {
      const config = await this.validateWebDavConfig(this.getWebDavConfig());
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
      const config = await this.validateWebDavConfig(this.getWebDavConfig());
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
      const config = await this.validateWebDavConfig(this.getWebDavConfig());
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
