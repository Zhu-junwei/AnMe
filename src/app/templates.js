export function createTemplates({ state, constants, i18nData, utils }) {
  return {
    panel() {
      const langOptions = Object.keys(i18nData)
        .map(
          (code) =>
            `<option value="${code}" ${state.currentLang === code ? 'selected' : ''}>${i18nData[code]._name}</option>`
        )
        .join('');

      return `
      <div class="acc-header">
          <div class="acc-header-actions" id="acc-header-actions">
              <button class="acc-toolbar-btn" id="btn-header-back" title="${utils.t('back')}">${constants.ICONS.BACK}</button>
              <button class="acc-toolbar-btn" id="btn-go-current-host" title="${utils.t('back_current_host')}">${constants.ICONS.HOME}</button>
              <button class="acc-toolbar-btn" id="btn-open-save-modal" title="${utils.t('btn_save')}">${constants.ICONS.SAVE}</button>
              <button class="acc-toolbar-btn" id="btn-clean-env" title="${utils.t('btn_clean')}">${constants.ICONS.CLEAN}</button>
          </div>
          <div class="acc-header-title" id="acc-header-text"></div>
          <div class="acc-header-right-actions">
              <button class="acc-toolbar-btn" id="btn-open-project" title="GitHub">${constants.ICONS.GITHUB}</button>
              <button class="acc-toolbar-btn" id="btn-open-webdav" title="${utils.t('nav_webdav')}">${constants.ICONS.CLOUD}</button>
              <button class="acc-toolbar-btn" id="btn-open-settings" title="${utils.t('nav_set')}">${constants.ICONS.SETTINGS}</button>
              <button class="acc-toolbar-btn" id="acc-close-btn" title="${utils.t('dlg_cancel')}" type="button">${constants.ICONS.CLOSE}</button>
            </div>
        </div>

      <div class="acc-tab-content active" id="pg-switch">
          <div class="acc-mgr-toolbar">
              <div class="acc-mgr-host-row" id="acc-host-row">
                  <div class="acc-host-picker" id="host-picker">
                      <button class="acc-host-trigger" id="host-trigger" type="button"></button>
                      <input type="text" id="host-search-input" class="acc-host-search-input" placeholder="${utils.t('search_site')}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
                      <div class="acc-host-menu" id="host-menu"></div>
                  </div>
                  <div class="acc-account-search-box" id="acc-account-search-box">
                      <input type="text" id="account-search-input" class="acc-account-search-input" placeholder="${utils.t('search_accounts_placeholder')}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
                  </div>
                  <button class="acc-toolbar-btn" id="btn-account-search-toggle" title="${utils.t('search_accounts')}">${constants.ICONS.SEARCH}</button>
              </div>
          </div>
          <div class="acc-scroll-area" id="switch-area"></div>
      </div>

      <div class="acc-tab-content" id="pg-set">
          <div class="acc-scroll-area">
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('set_fab_mode')}</div>
                  <div class="acc-set-row">
                      <button class="acc-btn acc-btn-light fab-mode-btn" data-val="auto" title="${utils.t('fab_auto_title')}">${utils.t('fab_auto')}</button>
                      <button class="acc-btn acc-btn-light fab-mode-btn" data-val="show" title="${utils.t('fab_show_title')}">${utils.t('fab_show')}</button>
                      <button class="acc-btn acc-btn-light fab-mode-btn" data-val="hide" title="${utils.t('fab_hide_title')}">${utils.t('fab_hide')}</button>
                  </div>
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('set_lang')}</div>
                  <div class="acc-set-row"><select id="lang-sel" class="acc-select-ui">${langOptions}</select></div>
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('set_host_display_mode')}</div>
                  <div class="acc-set-row">
                      <select id="host-display-mode-sel" class="acc-select-ui">
                          <option value="siteName" ${state.hostDisplayMode === 'siteName' ? 'selected' : ''}>${utils.t('host_display_mode_site_name')}</option>
                          <option value="domain" ${state.hostDisplayMode === 'domain' ? 'selected' : ''}>${utils.t('host_display_mode_domain')}</option>
                      </select>
                  </div>
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('set_backup')}</div>
                  <div class="acc-backup-row">
                      <button class="acc-icon-btn" id="btn-export-curr" title="${utils.t('btn_exp_curr')}">${constants.ICONS.EXPORT}</button>
                      <button class="acc-icon-btn" id="btn-export-all" title="${utils.t('btn_exp_all')}">${constants.ICONS.MUTIEXPORT}</button>
                      <button class="acc-icon-btn" id="btn-import-trigger" title="${utils.t('btn_imp')}">${constants.ICONS.IMPORT}</button>
                      <button class="acc-icon-btn danger" id="btn-clear-all" title="${utils.t('btn_clear_all')}">${constants.ICONS.DELETE}</button>
                      <input type="file" id="inp-import-file" accept=".json" style="display:none">
                  </div>
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('nav_about')}</div>
                  <button class="acc-btn acc-btn-light" id="go-about" style="width:100%">${utils.t('nav_about')}</button>
              </div>
              <div style="text-align:center;margin-top:20px;">
                  <span class="acc-link-btn" id="go-notice">${utils.t('notice_title')}</span>
              </div>
          </div>
      </div>

      <div class="acc-tab-content" id="pg-about">
           <div class="acc-scroll-area">
              <div class="acc-about-content">
                  <div class="acc-about-header">
                      <div class="acc-about-logo">${constants.ICONS.LOGO}</div>
                      <div class="acc-about-name">${constants.META.NAME}</div>
                      <div class="acc-about-ver">Version ${constants.META.VERSION}</div>
                      <div style="margin:3px 0; color:#666;">${utils.t('about_desc')}</div>
                  </div>
                  <div class="acc-about-item"><span class="acc-about-label">Author</span><span>${constants.META.AUTHOR}</span></div>
                  <div class="acc-about-item"><span class="acc-about-label">License</span><span>MIT</span></div>
                  <div class="acc-about-item"><span class="acc-about-label">Github</span><a href="${constants.META.LINKS.PROJECT}" target="_blank" style="color:#2196F3">View Repo</a></div>
                  <div style="text-align:center;margin-top:20px;">
                      <a href="${constants.META.LINKS.DONATE}" target="_blank" class="acc-btn acc-btn-blue" style="display:inline-flex; width:80%;">${constants.ICONS.DONATE} ${utils.t('donate')}</a>
                  </div>
              </div>
           </div>
      </div>

      <div class="acc-tab-content" id="pg-notice">
         <div class="acc-scroll-area"><div class="acc-notice-content">${utils.t('notice_content')}</div></div>
      </div>

      <div class="acc-tab-content" id="pg-account-settings">
          <div class="acc-scroll-area">
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('account_name')}<span class="acc-required">*</span></div>
                  <input type="text" id="account-settings-name" class="acc-input-text" placeholder="${utils.t('placeholder_name')}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('account_note')}</div>
                  <textarea id="account-settings-note" class="acc-input-text acc-input-note" placeholder="${utils.t('placeholder_note')}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
              </div>
              <div class="acc-row-btn">
                  <button class="acc-btn acc-btn-blue" id="btn-account-rename-save">${utils.t('save_changes')}</button>
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('danger_zone')}</div>
                  <button class="acc-btn acc-btn-danger" id="btn-account-delete">${constants.ICONS.DELETE} ${utils.t('btn_delete_account')}</button>
              </div>
          </div>
      </div>

      <div class="acc-tab-content" id="pg-webdav">
          <div class="acc-scroll-area">
              <div class="acc-set-group">
                  <div class="acc-webdav-head">
                      <div>
                          <div class="acc-set-title" style="margin-bottom:4px">${utils.t('webdav_account')}</div>
                          <div class="acc-webdav-status-row">
                              <span id="webdav-status" class="acc-webdav-status"></span>
                              <button class="acc-toolbar-btn acc-webdav-logout-btn" id="btn-webdav-logout" type="button" title="${utils.t('webdav_logout')}">${constants.ICONS.CLEAN}</button>
                          </div>
                      </div>
                      <button class="acc-btn acc-btn-light acc-webdav-config-btn" id="btn-webdav-config" type="button">${utils.t('webdav_config')}</button>
                  </div>
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('webdav_sync')}</div>
                  <div class="acc-row-btn">
                      <button class="acc-btn acc-btn-blue" id="btn-webdav-sync" type="button">${utils.t('webdav_sync_now')}</button>
                      <button class="acc-btn acc-btn-light" id="btn-webdav-refresh" type="button">${utils.t('webdav_refresh')}</button>
                  </div>
              </div>
              <div class="acc-set-group">
                  <div class="acc-set-title">${utils.t('webdav_backup_list')}</div>
                  <div id="webdav-backup-list" class="acc-webdav-list"></div>
              </div>
          </div>
      </div>
      `;
    },
    switchCard(key, data) {
      const switchable = state.currentViewingHost === constants.HOST;
      const accountName = utils.extractName(key);
      const escapedAccountName = utils.escapeHtml(accountName);
      const accountNote = utils.normalizeNoteText(data?.note);
      const escapedAccountNote = utils.escapeHtml(accountNote);
      return `
      <div class="acc-switch-item" data-key="${key}" draggable="false">
          <span class="acc-switch-handle" aria-hidden="true"><span>::</span><span>::</span></span>
          <div class="acc-switch-card${switchable ? '' : ' acc-switch-card-static'}" data-key="${key}">
              ${accountNote ? `
              <div class="acc-switch-note-wrap">
                  <button class="acc-switch-note-btn" type="button" data-key="${key}" data-note="${escapedAccountNote}" aria-label="${utils.t('view_note')}">${constants.ICONS.NOTICE}</button>
              </div>` : ''}
              <button class="acc-switch-settings-btn" data-key="${key}" title="${utils.t('account_settings')}">${constants.ICONS.SETTINGS}</button>
              <div class="acc-card-body">
                  <div class="acc-card-name">
                      <button class="acc-card-name-icon" type="button" data-name="${escapedAccountName}" title="${utils.t('copy_account_name')}">${constants.ICONS.USER}</button>
                      <span class="acc-card-name-text" title="${escapedAccountName}">${escapedAccountName}</span>
                  </div>
                  <div class="acc-card-meta">
                      <span class="acc-mini-tag">${utils.formatTime(data.time)}</span>
                      ${(data.cookies?.length || 0) ? `<span class="acc-mini-tag acc-click-tag" title="Cookie" data-type="cookies">CK: ${data.cookies.length}</span>` : ''}
                      ${Object.keys(data.localStorage || {}).length ? `<span class="acc-mini-tag acc-click-tag" title="LocalStorage" data-type="localStorage">LS: ${Object.keys(data.localStorage).length}</span>` : ''}
                      ${Object.keys(data.sessionStorage || {}).length ? `<span class="acc-mini-tag acc-click-tag" title="SessionStorage" data-type="sessionStorage">SS: ${Object.keys(data.sessionStorage).length}</span>` : ''}
                  </div>
              </div>
          </div>
      </div>
      `;
    },
    noData() {
      return `<div style="text-align:center;color:#ccc;margin-top:100px;font-size:13px;">${utils.t('no_data')}</div>`;
    }
  };
}
