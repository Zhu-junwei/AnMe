export function createBackupMethods({ constants, utils, getUI }) {
  return {
    buildExportObject(scope) {
      const exportObj = {};
      const allKeys = GM_listValues();
      const targetAccountKeys =
        scope === 'current'
          ? allKeys.filter((key) => key.startsWith(`${constants.PREFIX}${constants.HOST}::`))
          : allKeys.filter((key) => key.startsWith(constants.PREFIX));

      if (targetAccountKeys.length === 0) {
        return null;
      }

      targetAccountKeys.forEach((key) => {
        exportObj[key] = GM_getValue(key);
      });

      if (scope === 'current') {
        const orderKey = constants.ORDER_PREFIX + constants.HOST;
        const orderValue = GM_getValue(orderKey);
        if (orderValue) exportObj[orderKey] = orderValue;
        const siteNameKey = constants.SITE_NAME_PREFIX + constants.HOST;
        const siteNameValue = GM_getValue(siteNameKey);
        if (siteNameValue) exportObj[siteNameKey] = siteNameValue;
      } else {
        allKeys
          .filter((key) => key.startsWith(constants.ORDER_PREFIX) || key.startsWith(constants.SITE_NAME_PREFIX))
          .forEach((key) => {
            exportObj[key] = GM_getValue(key);
          });
      }

      return exportObj;
    },
    async exportData(scope) {
      const ui = getUI();
      const exportObj = this.buildExportObject(scope);
      if (!exportObj) {
        await ui.alert(utils.t('export_err'));
        return;
      }

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadSite = scope === 'current' ? constants.HOST : 'All_Sites';
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${constants.META.NAME}_Backup_${downloadSite}_${new Date()
        .toLocaleString('sv-SE')
        .replace(' ', '_')
        .replace(/:/g, '-')}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    importBackupObject(data, source = 'import') {
      let count = 0;
      const hostsInFile = [
        ...new Set(
          Object.keys(data)
            .filter((key) => key.startsWith(constants.PREFIX))
            .map((key) => key.replace(constants.PREFIX, '').split('::')[0])
        )
      ];

      hostsInFile.forEach((host) => {
        const orderKey = constants.ORDER_PREFIX + host;
        const siteNameKey = constants.SITE_NAME_PREFIX + host;
        const fileOrder = data[orderKey] || [];
        const localOrder = GM_getValue(orderKey, []);
        if (data[siteNameKey]) {
          GM_setValue(siteNameKey, data[siteNameKey]);
        }
        const namesToImport =
          fileOrder.length > 0
            ? fileOrder
            : Object.keys(data)
                .filter((key) => key.startsWith(`${constants.PREFIX}${host}::`))
                .map((key) => key.split('::')[1]);

        namesToImport.forEach((name) => {
          const fullKey = `${constants.PREFIX}${host}::${name}`;
          if (!data[fullKey]) return;

          GM_setValue(fullKey, data[fullKey]);
          if (!localOrder.includes(name)) {
            localOrder.push(name);
          }
          count += 1;
        });

        GM_setValue(orderKey, localOrder);
      });

      return {
        count,
        messageKey: source === 'sync' ? 'sync_restore_ok' : 'import_ok'
      };
    },
    async importData(file) {
      const ui = getUI();
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          const result = this.importBackupObject(data, 'import');
          await ui.alert(utils.t(result.messageKey).replace('{count}', result.count));
          ui.refresh();
        } catch {
          await ui.alert(utils.t('import_err'));
        }
      };

      reader.readAsText(file);
    },
    clearAllData() {
      GM_listValues().forEach((key) => {
        if (
          key.startsWith(constants.PREFIX) ||
          key.startsWith(constants.ORDER_PREFIX) ||
          key.startsWith(constants.SITE_NAME_PREFIX) ||
          key === constants.CFG.HOST_ICON_CACHE
        ) {
          GM_deleteValue(key);
        }
      });
    }
  };
}
