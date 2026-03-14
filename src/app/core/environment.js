export function createEnvironmentMethods({ getUI, shared }) {
  return {
    async loadAccount(key) {
      const ui = getUI();
      const data = GM_getValue(key);
      if (!data) return;

      ui.toggleLoading(true, 'Switching...');

      try {
        shared.clearBrowserStorage();
        await shared.deleteAllCookies();

        Object.entries(data.localStorage || {}).forEach(([storageKey, value]) => localStorage.setItem(storageKey, value));
        Object.entries(data.sessionStorage || {}).forEach(([storageKey, value]) => sessionStorage.setItem(storageKey, value));

        for (const cookie of data.cookies || []) {
          const cookieData = { ...cookie };
          delete cookieData.hostOnly;
          delete cookieData.session;
          await shared.setCookie(cookieData);
        }

        location.reload();
      } catch (error) {
        console.error(error);
        ui.toggleLoading(false);
        ui.alert('Switch failed!');
      }
    },
    async cleanEnvironment() {
      const ui = getUI();
      ui.toggleLoading(true, 'Cleaning...');
      shared.clearBrowserStorage();
      await shared.deleteAllCookies();
      location.reload();
    }
  };
}
