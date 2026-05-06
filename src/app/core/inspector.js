export function createInspectorMethods({ utils, getUI }) {
  return {
    inspectData(key, type) {
      const data = GM_getValue(key);
      if (!data) return;

      let content = null;
      if (type === 'cookies') content = data.cookies;
      if (type === 'localStorage') content = data.localStorage;
      if (type === 'sessionStorage') content = data.sessionStorage;
      if (!content) return;

      getUI()?.showDataInspector({
        title: `${utils.extractName(key)} - ${type}`,
        type,
        data: content
      });
    }
  };
}
