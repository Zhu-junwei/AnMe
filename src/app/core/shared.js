export function createCoreShared() {
  return {
    listCookies() {
      return new Promise((resolve) => GM_cookie.list({}, resolve));
    },
    deleteCookie(cookie) {
      const details = typeof cookie === 'string' ? { name: cookie } : { ...(cookie || {}) };
      return new Promise((resolve) => GM_cookie.delete(details, resolve));
    },
    setCookie(cookieData) {
      return new Promise((resolve) => GM_cookie.set(cookieData, resolve));
    },
    async deleteAllCookies() {
      const cookies = await this.listCookies();
      for (const cookie of cookies || []) {
        await this.deleteCookie(cookie);
      }
    },
    clearBrowserStorage() {
      localStorage.clear();
      sessionStorage.clear();
    }
  };
}
