export function createCoreShared() {
  return {
    listCookies() {
      return new Promise((resolve) => GM_cookie.list({}, resolve));
    },
    deleteCookie(name) {
      return new Promise((resolve) => GM_cookie.delete({ name }, resolve));
    },
    setCookie(cookieData) {
      return new Promise((resolve) => GM_cookie.set(cookieData, resolve));
    },
    async deleteAllCookies() {
      const cookies = await this.listCookies();
      for (const cookie of cookies || []) {
        await this.deleteCookie(cookie.name);
      }
    },
    clearBrowserStorage() {
      localStorage.clear();
      sessionStorage.clear();
    }
  };
}
