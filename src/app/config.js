export const CONST = {
        PREFIX: 'acc_stable_',
        ORDER_PREFIX: 'acc_order_',
        SITE_NAME_PREFIX: 'acc_site_name_',
        CFG: {
            LANG: 'cfg_lang',
            FAB_MODE: 'cfg_fab_mode',
            FAB_POS: 'cfg_fab_pos',
            HOST_DISPLAY_MODE: 'cfg_host_display_mode',
            WEBDAV_CONFIG: 'cfg_webdav_config',
            WEBDAV_BACKUPS_CACHE: 'cfg_webdav_backups_cache'
        },
        HOST: location.hostname,
        META: {
            NAME: GM_info.script.name,
            VERSION: GM_info.script.version,
            AUTHOR: GM_info.script.author,
            LINKS: {
                PROJECT: "https://github.com/Zhu-junwei/AnMe",
                DONATE: "https://www.cnblogs.com/zjw-blog/p/19466109"
            }
        },
        ICONS: {
            LOGO: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 17.5C21 19.433 19.433 21 17.5 21C15.567 21 14 19.433 14 17.5C14 15.567 15.567 14 17.5 14C19.433 14 21 15.567 21 17.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M2 11H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 11L4.6138 8.54479C5.15947 6.36211 5.43231 5.27077 6.24609 4.63538C7.05988 4 8.1848 4 10.4347 4H13.5653C15.8152 4 16.9401 4 17.7539 4.63538C18.5677 5.27077 18.8405 6.36211 19.3862 8.54479L20 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 17.5C10 19.433 8.433 21 6.5 21C4.567 21 3 19.433 3 17.5C3 15.567 4.567 14 6.5 14C8.433 14 10 15.567 10 17.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M10 17.4999L10.6584 17.1707C11.5029 16.7484 12.4971 16.7484 13.3416 17.1707L14 17.4999" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            GITHUB: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.648.5.5 5.648.5 12a11.5 11.5 0 0 0 7.86 10.92c.575.105.785-.25.785-.555l-.015-2.145c-3.198.695-3.873-1.36-3.873-1.36-.525-1.335-1.28-1.69-1.28-1.69-1.045-.715.08-.7.08-.7 1.155.08 1.765 1.185 1.765 1.185 1.025 1.76 2.69 1.25 3.345.955.105-.745.4-1.25.725-1.535-2.555-.29-5.24-1.28-5.24-5.695 0-1.255.45-2.28 1.185-3.085-.12-.29-.515-1.46.11-3.04 0 0 .965-.31 3.165 1.18a10.96 10.96 0 0 1 5.76 0c2.2-1.49 3.165-1.18 3.165-1.18.625 1.58.23 2.75.115 3.04.735.805 1.18 1.83 1.18 3.085 0 4.425-2.69 5.4-5.255 5.685.41.355.775 1.055.775 2.125l-.015 3.15c0 .31.205.67.79.555A11.502 11.502 0 0 0 23.5 12C23.5 5.648 18.352.5 12 .5Z"/></svg>`,
            CLOUD: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 18.5H16.25C18.8734 18.5 21 16.3734 21 13.75C21 11.2747 19.1066 9.24147 16.6879 9.02035C16.0218 6.69436 13.8837 5 11.375 5C8.34144 5 5.875 7.46644 5.875 10.5C5.875 10.7171 5.88772 10.9312 5.91246 11.1413C4.02877 11.7215 2.75 13.4754 2.75 15.4375C2.75 17.1243 4.11713 18.5 5.8125 18.5H7.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            USER: `<svg width="1em" height="1em" viewBox="0 0 24 24"  fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="17" rx="7" ry="4" stroke="currentColor" stroke-width="1.5"/></svg>`,
            SETTINGS: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.84308 3.80211C9.8718 2.6007 10.8862 2 12 2C13.1138 2 14.1282 2.6007 16.1569 3.80211L16.8431 4.20846C18.8718 5.40987 19.8862 6.01057 20.4431 7C21 7.98943 21 9.19084 21 11.5937V12.4063C21 14.8092 21 16.0106 20.4431 17C19.8862 17.9894 18.8718 18.5901 16.8431 19.7915L16.1569 20.1979C14.1282 21.3993 13.1138 22 12 22C10.8862 22 9.8718 21.3993 7.84308 20.1979L7.15692 19.7915C5.1282 18.5901 4.11384 17.9894 3.55692 17C3 16.0106 3 14.8092 3 12.4063V11.5937C3 9.19084 3 7.98943 3.55692 7C4.11384 6.01057 5.1282 5.40987 7.15692 4.20846L7.84308 3.80211Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>`,
            HELP: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.75C12.4142 17.75 12.75 17.4142 12.75 17V11C12.75 10.5858 12.4142 10.25 12 10.25C11.5858 10.25 11.25 10.5858 11.25 11V17C11.25 17.4142 11.5858 17.75 12 17.75Z" fill="currentColor"/><path d="M12 7C12.5523 7 13 7.44772 13 8C13 8.55228 12.5523 9 12 9C11.4477 9 11 8.55228 11 8C11 7.44772 11.4477 7 12 7Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75Z" fill="currentColor"/></svg>`,
            LOCK: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 9.30277V8C5.25 4.27208 8.27208 1.25 12 1.25C15.7279 1.25 18.75 4.27208 18.75 8V9.30277C18.9768 9.31872 19.1906 9.33948 19.3918 9.36652C20.2919 9.48754 21.0497 9.74643 21.6517 10.3483C22.2536 10.9503 22.5125 11.7081 22.6335 12.6082C22.75 13.4752 22.75 14.5775 22.75 15.9451V16.0549C22.75 17.4225 22.75 18.5248 22.6335 19.3918C22.5125 20.2919 22.2536 21.0497 21.6517 21.6516C21.0497 22.2536 20.2919 22.5125 19.3918 22.6335C18.5248 22.75 17.4225 22.75 16.0549 22.75H7.94513C6.57754 22.75 5.47522 22.75 4.60825 22.6335C3.70814 22.5125 2.95027 22.2536 2.34835 21.6516C1.74643 21.0497 1.48754 20.2919 1.36652 19.3918C1.24996 18.5248 1.24998 17.4225 1.25 16.0549V15.9451C1.24998 14.5775 1.24996 13.4752 1.36652 12.6082C1.48754 11.7081 1.74643 10.9503 2.34835 10.3483C2.95027 9.74643 3.70814 9.48754 4.60825 9.36652C4.80938 9.33948 5.02317 9.31872 5.25 9.30277ZM6.75 8C6.75 5.10051 9.10051 2.75 12 2.75C14.8995 2.75 17.25 5.10051 17.25 8V9.25344C16.8765 9.24999 16.4784 9.24999 16.0549 9.25H7.94513C7.52161 9.24999 7.12353 9.24999 6.75 9.25344V8ZM3.40901 11.409C3.68577 11.1322 4.07435 10.9518 4.80812 10.8531C5.56347 10.7516 6.56459 10.75 8 10.75H16C17.4354 10.75 18.4365 10.7516 19.1919 10.8531C19.9257 10.9518 20.3142 11.1322 20.591 11.409C20.8678 11.6858 21.0482 12.0743 21.1469 12.8081C21.2484 13.5635 21.25 14.5646 21.25 16C21.25 17.4354 21.2484 18.4365 21.1469 19.1919C21.0482 19.9257 20.8678 20.3142 20.591 20.591C20.3142 20.8678 19.9257 21.0482 19.1919 21.1469C18.4365 21.2484 17.4354 21.25 16 21.25H8C6.56459 21.25 5.56347 21.2484 4.80812 21.1469C4.07435 21.0482 3.68577 20.8678 3.40901 20.591C3.13225 20.3142 2.9518 19.9257 2.85315 19.1919C2.75159 18.4365 2.75 17.4354 2.75 16C2.75 14.5646 2.75159 13.5635 2.85315 12.8081C2.9518 12.0743 3.13225 11.6858 3.40901 11.409Z" fill="currentColor"/></svg>`,
            EXPORT: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16V3M12 3L16 7.375M12 3L8 7.375" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            MUTIEXPORT: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 15L12 2M12 2L15 5.5M12 2L9 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            IMPORT: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,24) scale(1,-1)"><path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16V3M12 3L16 7.375M12 3L8 7.375" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            DELETE: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.1709 4C9.58273 2.83481 10.694 2 12.0002 2C13.3064 2 14.4177 2.83481 14.8295 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M20.5001 6H3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9.5 11L10 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14.5 11L14 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            DONATE: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.28441 11.2661C3.15113 9.26687 3.08449 8.26726 3.67729 7.63363C4.27009 7 5.27191 7 7.27555 7H12.7245C14.7281 7 15.7299 7 16.3227 7.63363C16.9155 8.26726 16.8489 9.26687 16.7156 11.2661L16.3734 16.3991C16.1964 19.054 16.1079 20.3815 15.2429 21.1907C14.3779 22 13.0475 22 10.3867 22H9.61333C6.95253 22 5.62212 22 4.75712 21.1907C3.89211 20.3815 3.80361 19.054 3.62662 16.3991L3.28441 11.2661Z" stroke="currentColor" stroke-width="1.5"/><path d="M17 17H18C20.2091 17 22 15.2091 22 13C22 10.7909 20.2091 9 18 9H17" stroke="currentColor" stroke-width="1.5"/><path d="M16 18H4" stroke="currentColor" stroke-width="1.5"/><path d="M6.05081 5.0614L6.46143 4.48574C6.6882 4.16781 6.61431 3.72623 6.29638 3.49945C5.97845 3.27267 5.90455 2.8311 6.13133 2.51317L6.54195 1.9375M14.0508 5.0614L14.4614 4.48574C14.6882 4.16781 14.6143 3.72623 14.2964 3.49945C13.9784 3.27267 13.9046 2.8311 14.1313 2.51317L14.5419 1.9375M10.0508 5.0614L10.4614 4.48574C10.6882 4.16781 10.6143 3.72623 10.2964 3.49945C9.97845 3.27267 9.90455 2.8311 10.1313 2.51317L10.5419 1.9375" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            SAVE: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7.8C4 6.11984 4 5.27976 4.32698 4.63803C4.6146 4.07354 5.07354 3.6146 5.63803 3.32698C6.27976 3 7.11984 3 8.8 3H15.2C16.8802 3 17.7202 3 18.362 3.32698C18.9265 3.6146 19.3854 4.07354 19.673 4.63803C20 5.27976 20 6.11984 20 7.8V16.2C20 17.8802 20 18.7202 19.673 19.362C19.3854 19.9265 18.9265 20.3854 18.362 20.673C17.7202 21 16.8802 21 15.2 21H8.8C7.11984 21 6.27976 21 5.63803 20.673C5.07354 20.3854 4.6146 19.9265 4.32698 19.362C4 18.7202 4 17.8802 4 16.2V7.8Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 3V8H15V3" stroke="currentColor" stroke-width="1.5"/><path d="M8 21V15H16V21" stroke="currentColor" stroke-width="1.5"/><path d="M16 8H16.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
            SEARCH: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M20 20L16.2 16.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            EDIT: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 6.5L17.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 20L7.5 19.5L18.5 8.5C19.3284 7.67157 19.3284 6.32843 18.5 5.5V5.5C17.6716 4.67157 16.3284 4.67157 15.5 5.5L4.5 16.5L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
            CLOSE: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7L17 17M17 7L7 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            CLEAN: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 7V5.5C10 4.11929 11.1193 3 12.5 3H17.5C18.8807 3 20 4.11929 20 5.5V18.5C20 19.8807 18.8807 21 17.5 21H12.5C11.1193 21 10 19.8807 10 18.5V17" stroke="currentColor" stroke-width="1.5"/><path d="M14 12H4M4 12L7 9M4 12L7 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            BACK: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
            HOME: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.75L10.4697 4.72557C11.3788 3.99241 12.6212 3.99241 13.5303 4.72557L21 10.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.75 9.5V18C5.75 19.2426 6.75736 20.25 8 20.25H16C17.2426 20.25 18.25 19.2426 18.25 18V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 20.25V15.5C10 14.8096 10.5596 14.25 11.25 14.25H12.75C13.4404 14.25 14 14.8096 14 15.5V20.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
            NOTICE: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3.75H14.7574C15.753 3.75 16.7078 4.14509 17.4118 4.84835L19.1517 6.58691C19.8561 7.29054 20.2522 8.24559 20.2527 9.24102L20.2571 18C20.2571 19.7949 18.802 21.25 17.0071 21.25H7C5.20507 21.25 3.75 19.7949 3.75 18V7C3.75 5.20507 5.20507 3.75 7 3.75Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 9H16M8 13H16M8 17H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        }
    };

export const I18N_DATA = {
      zh: {_name:"简体中文",nav_set:"高级设置",nav_notice:"使用声明",nav_about:"关于脚本",back_current_host:"返回当前网站账号",open_site:"打开网站",edit_site_name:"编辑站点名字",search_site:"搜索网站...",search_accounts:"搜索账号",close_search_accounts:"关闭搜索",search_accounts_placeholder:"搜索当前网站账号...",account_settings:"账号设置",site_name:"站点名称",account_name:"账号名称",save_changes:"保存修改",btn_delete_account:"删除该账号",danger_zone:"危险操作",rename_conflict:"该名称已存在，请换一个名称。",confirm_delete: "确定要删除该账号记录吗？",placeholder_site_name:"给当前网站命名...",placeholder_name:"给新账号命名...",tip_help:"切换登录失败？尝试勾选 LocalStorage 和 SessionStorage。",tip_lock:"为保证正常读取Cookie，请在篡改猴高级模式下，设置允许脚本访问 Cookie: ALL",btn_save:"保存当前账号",confirm_overwrite: "⚠️ 该名称已存在，确定要覆盖原有记录吗？",btn_clean:"切换新环境 (清空本站痕迹)",save_empty_err:"⚠️ 没有检测到可保存的数据",copy_account_name:"复制账号名",copy_failed:"复制失败，请手动复制。",toast_saved:"账号已保存",toast_renamed:"账号名称已更新",toast_deleted:"账号已删除",toast_copied:"账号名已复制",toast_site_name_updated:"站点名称已更新",set_fab_mode:"悬浮球显示模式",fab_auto:"智能",fab_show:"常驻",fab_hide:"隐藏",fab_auto_title:"有账号记录时自动显示，无记录时隐藏",fab_show_title:"始终显示悬浮球",fab_hide_title:"平时不显示，仅能通过菜单唤起",set_lang:"语言设置 / Language",set_host_display_mode:"站点列表显示模式",host_display_mode_site_name:"站点名字",host_display_mode_domain:"域名",set_backup:"数据备份与还原",btn_exp_curr:"导出当前网站数据",btn_exp_all:"导出脚本全部数据",btn_imp:"导入备份文件",donate:"支持作者",btn_clear_all:"清空脚本所有数据 (慎用)",notice_title:"《使用声明与免责条款》",back:"← 返回上一级",no_data:"🍃 暂无账号记录",confirm_clean:"确定清空当前网站所有痕迹并开启新环境？",confirm_clear_all:"⚠️ 警告：这将删除本脚本保存的所有网站的所有账号数据！且无法恢复！",import_ok:"✅ 成功导入/更新 {count} 个账号！",import_err:"❌ 导入失败：文件格式错误",export_err:"⚠️ 没有可导出的数据",menu_open:"🚀 开启账号管理",dlg_ok:"确定",dlg_cancel:"取消",about_desc:"通用多网站多账号切换器",notice_content:`<h4>1. 脚本功能说明</h4><p>本脚本通过篡改猴插件提供的存储API，将当前网站的 Cookie、LocalStorage 和 SessionStorage 进行快照保存。当您点击切换时，脚本会清空当前痕迹并还原选中的快照数据，从而实现多账号快速登录。</p><h4>2. 数据存储与联网说明</h4><p>账号数据默认存储在您浏览器的篡改猴插件内部管理器中（GM_setValue）。脚本默认不会主动联网或上传数据；只有在您手动配置并使用 WebDAV 云同步功能时，脚本才会按您的操作访问您指定的远程服务并上传或下载备份文件。</p><h4>3. 风险提示</h4><p>由于浏览器环境的开放性，本脚本无法阻止同域名下的其他恶意脚本通过篡改猴 API 或存储机制尝试获取这些数据。请勿在公共电脑或不可信的设备环境中使用本脚本保存重要账号。</p><h4>4. 免责声明</h4><p>本脚本仅供学习交流使用。因使用本脚本导致的账号被封禁、数据泄露或任何形式的损失，作者不承担任何法律责任。</p>`},
      en: {_name:"English",nav_set:"Settings",nav_notice:"Disclaimer",nav_about:"About",back_current_host:"Back to current site",open_site:"Open site",edit_site_name:"Edit site name",search_site:"Search sites...",search_accounts:"Search accounts",close_search_accounts:"Close search",search_accounts_placeholder:"Search accounts on this site...",account_settings:"Account Settings",site_name:"Site Name",account_name:"Account Name",save_changes:"Save Changes",btn_delete_account:"Delete Account",danger_zone:"Danger Zone",rename_conflict:"This name already exists. Please choose another one.",confirm_delete: "Are you sure you want to delete this account?",placeholder_site_name:"Name this site...",placeholder_name:"Name this account...",tip_help:"Switch failed? Try checking LocalStorage/SessionStorage.",tip_lock:"To ensure cookies can be read correctly, open Tampermonkey’s Advanced Settings and change “Allow scripts to access cookies” to “ALL”.",btn_save:"Save Current",confirm_overwrite: "⚠️ Name already exists. Do you want to overwrite it?",btn_clean:"Switch to a new environment (clear all data for this site)",save_empty_err:"⚠️ No data detected to save",copy_account_name:"Copy account name",copy_failed:"Copy failed. Please copy it manually.",toast_saved:"Account saved",toast_renamed:"Account name updated",toast_deleted:"Account deleted",toast_copied:"Account name copied",toast_site_name_updated:"Site name updated",set_fab_mode:"Float Button Mode",fab_auto:"Auto",fab_show:"Show",fab_hide:"Hide",fab_auto_title:"Automatically show when accounts exist, hide when none",fab_show_title:"Always show the floating button",fab_hide_title:"Hidden by default, can only be activated via the menu",set_lang:"语言设置 / Language",set_host_display_mode:"Site List Display",host_display_mode_site_name:"Site Name",host_display_mode_domain:"Domain",set_backup:"Backup & Restore",btn_exp_curr:"Export Current Site",btn_exp_all:"Export All Data",btn_imp:"Import Backup",donate:"Buy me a coffee",btn_clear_all:"Clear all script data (use with caution)",notice_title:"Disclaimer & Terms",back:"← Back",no_data:"🍃 No accounts",confirm_clean:"Are you sure you want to clear all traces of the current website and start a new environment?",confirm_clear_all:"⚠️ Warning: This will delete all account data for all websites saved by this script, and cannot be undone!",import_ok:"✅ Successfully imported/updated {count} account(s)!",import_err:"❌ Invalid format",export_err:"⚠️ No data",menu_open:"🚀 Open Manager",dlg_ok:"OK",dlg_cancel:"Cancel",about_desc:"Universal Multi-Site Account Switcher",notice_content:`<h4>1. Script Functionality</h4><p>This script utilizes the storage API provided by Tampermonkey to take snapshots of the current website's Cookies, LocalStorage, and SessionStorage. When switching accounts, the script clears current session data and restores the selected snapshot, enabling rapid multi-account login.</p><h4>2. Data Storage & Network Access</h4><p>Account data is stored locally in your browser's Tampermonkey extension manager (via GM_setValue) by default. The script does not proactively upload data or access remote services unless you explicitly configure and use the WebDAV sync feature; only then will it connect to the WebDAV server you specified to upload or download backup files.</p><h4>3. Risk Warning</h4><p>Due to the open nature of browser environments, this script cannot prevent other malicious scripts on the same domain from attempting to access data via storage mechanisms. Please avoid using this script to save sensitive accounts on public or untrusted devices.</p><h4>4. Disclaimer</h4><p>This script is intended for educational and exchange purposes only. The author shall not be held legally responsible for any account bans, data breaches, or any form of loss resulting from the use of this script.</p>`},
      es: {_name:"Español",nav_set:"Configuración",nav_notice:"Aviso legal",nav_about:"Acerca de",back_current_host:"Volver al sitio actual",open_site:"Abrir sitio",edit_site_name:"Editar nombre del sitio",search_site:"Buscar sitios...",search_accounts:"Buscar cuentas",close_search_accounts:"Cerrar búsqueda",search_accounts_placeholder:"Buscar cuentas en este sitio...",account_settings:"Configuración de la cuenta",site_name:"Nombre del sitio",account_name:"Nombre de la cuenta",save_changes:"Guardar cambios",btn_delete_account:"Eliminar cuenta",danger_zone:"Zona peligrosa",rename_conflict:"Ese nombre ya existe. Usa otro nombre.",confirm_delete: "¿Estás seguro de que deseas eliminar esta cuenta?",placeholder_site_name:"Nombre para este sitio...",placeholder_name:"Nombre para esta cuenta...",tip_help:"¿Falló el cambio de cuenta? Intenta marcar LocalStorage y SessionStorage.",tip_lock:"Para garantizar la correcta lectura de cookies, abre la configuración avanzada de Tampermonkey y establece “Permitir que los scripts accedan a cookies” en “ALL”.",btn_save:"Guardar cuenta actual",confirm_overwrite: "⚠️ El nombre ya existe. ¿Deseas sobrescribirlo?",btn_clean:"Cambiar a un nuevo entorno (borrar datos del sitio)",save_empty_err:"⚠️ No se detectaron datos para guardar",copy_account_name:"Copiar nombre de la cuenta",copy_failed:"No se pudo copiar. Cópialo manualmente.",toast_saved:"Cuenta guardada",toast_renamed:"Nombre de cuenta actualizado",toast_deleted:"Cuenta eliminada",toast_copied:"Nombre de cuenta copiado",toast_site_name_updated:"Nombre del sitio actualizado",set_fab_mode:"Modo del botón flotante",fab_auto:"Automático",fab_show:"Siempre visible",fab_hide:"Oculto",fab_auto_title:"Se muestra automáticamente cuando hay cuentas guardadas; se oculta si no hay ninguna",fab_show_title:"El botón flotante se muestra siempre",fab_hide_title:"Oculto por defecto, solo accesible desde el menú",set_lang:"Idioma / Language",set_host_display_mode:"Modo de lista de sitios",host_display_mode_site_name:"Nombre del sitio",host_display_mode_domain:"Dominio",set_backup:"Copia de seguridad y restauración",btn_exp_curr:"Exportar datos del sitio actual",btn_exp_all:"Exportar todos los datos del script",btn_imp:"Importar archivo de respaldo",donate:"Apoyar al autor",btn_clear_all:"Borrar todos los datos del script (usar con precaución)",notice_title:"Términos de uso y descargo de responsabilidad",back:"← Volver",no_data:"🍃 No hay cuentas",confirm_clean:"¿Seguro que deseas borrar todos los rastros del sitio actual y comenzar un nuevo entorno?",confirm_clear_all:"⚠️ Advertencia: Esto eliminará todos los datos de cuentas de todos los sitios guardados por este script. ¡Esta acción no se puede deshacer!",import_ok:"✅ Se importaron/actualizaron correctamente {count} cuenta(s)",import_err:"❌ Error de importación: formato de archivo inválido",export_err:"⚠️ No hay datos para exportar",menu_open:"🚀 Abrir gestor de cuentas",dlg_ok:"Aceptar",dlg_cancel:"Cancelar",about_desc:"Conmutador universal de múltiples cuentas para múltiples sitios",notice_content:`<h4>1. Funcionalidad del script</h4><p>Este script utiliza la API de almacenamiento proporcionada por Tampermonkey para guardar instantáneas de las Cookies, LocalStorage y SessionStorage del sitio web actual. Al cambiar de cuenta, el script borra los datos actuales y restaura la instantánea seleccionada, permitiendo un inicio de sesión rápido con múltiples cuentas.</p><h4>2. Almacenamiento y acceso de red</h4><p>Los datos de las cuentas se almacenan localmente en el administrador interno de Tampermonkey (mediante GM_setValue) de forma predeterminada. El script no sube datos ni accede a servicios remotos por iniciativa propia; solo se conectará al servidor WebDAV que configures cuando habilites y utilices explícitamente la función de sincronización para subir o descargar copias de seguridad.</p><h4>3. Advertencia de riesgo</h4><p>Debido a la naturaleza abierta del entorno del navegador, este script no puede impedir que otros scripts maliciosos bajo el mismo dominio intenten acceder a estos datos mediante mecanismos de almacenamiento. Evita guardar cuentas sensibles en equipos públicos o no confiables.</p><h4>4. Descargo de responsabilidad</h4><p>Este script se proporciona únicamente con fines educativos y de intercambio. El autor no asume ninguna responsabilidad legal por bloqueos de cuentas, fugas de datos o cualquier tipo de pérdida derivada del uso de este script.</p>`}
    };

Object.assign(I18N_DATA.zh, {
    nav_webdav: "WebDAV 同步",
    webdav_account: "WebDAV 账号",
    webdav_config: "设置",
    webdav_not_configured: "尚未配置 WebDAV",
    webdav_connected_as: "当前账号：{user}",
    webdav_url: "服务地址",
    webdav_url_placeholder: "例如: https://dav.example.com/remote.php/dav/files/user",
    webdav_username: "用户名",
    webdav_username_placeholder: "请输入 WebDAV 用户名",
    webdav_password: "密码",
    webdav_password_placeholder: "请输入 WebDAV 密码",
    webdav_verify_save: "验证并保存",
    webdav_sync: "云同步",
    webdav_sync_now: "备份",
    webdav_refresh: "刷新列表",
    webdav_backup_list: "云端备份列表",
    webdav_restore: "恢复",
    webdav_delete: "删除",
    webdav_no_backups: "暂无云端备份",
    webdav_need_config: "请先填写并验证 WebDAV 配置。",
    webdav_loading: "正在加载云端备份...",
    webdav_validating: "正在验证 WebDAV...",
    webdav_verified: "WebDAV 验证成功",
    webdav_verify_err: "WebDAV 验证失败",
    webdav_missing_config: "请完整填写 WebDAV 服务地址、用户名和密码。",
    webdav_syncing: "正在同步到 WebDAV...",
    webdav_sync_ok: "同步已完成",
    webdav_sync_err: "同步失败",
    webdav_list_err: "获取云端备份列表失败",
    webdav_delete_confirm: "确定删除云端备份：{name}？",
    webdav_delete_ok: "云端备份已删除",
    webdav_delete_err: "删除云端备份失败",
    webdav_restore_confirm: "确定用该云端备份恢复本地数据：{name}？",
    webdav_restoring: "正在从 WebDAV 恢复...",
    webdav_logout: "退出 WebDAV",
    webdav_logout_confirm: "确定退出 WebDAV 并删除本地保存的账号信息吗？",
    webdav_logout_ok: "已退出 WebDAV",
    webdav_timeout: "WebDAV 请求超时，请检查网络或服务状态。",
    sync_restore_ok: "✅ 已从云端同步恢复 {count} 个账号！",
    sync_restore_err: "云端恢复失败，压缩包或数据文件无效。"
});

Object.assign(I18N_DATA.en, {
    nav_webdav: "WebDAV Sync",
    webdav_account: "WebDAV Account",
    webdav_config: "Settings",
    webdav_not_configured: "WebDAV is not configured yet",
    webdav_connected_as: "Current account: {user}",
    webdav_url: "Server URL",
    webdav_url_placeholder: "Example: https://dav.example.com/remote.php/dav/files/user",
    webdav_username: "Username",
    webdav_username_placeholder: "Enter WebDAV username",
    webdav_password: "Password",
    webdav_password_placeholder: "Enter WebDAV password",
    webdav_verify_save: "Verify and Save",
    webdav_sync: "Cloud Sync",
    webdav_sync_now: "Backup",
    webdav_refresh: "Refresh List",
    webdav_backup_list: "Cloud Backup List",
    webdav_restore: "Restore",
    webdav_delete: "Delete",
    webdav_no_backups: "No cloud backups yet",
    webdav_need_config: "Fill in and verify your WebDAV settings first.",
    webdav_loading: "Loading cloud backups...",
    webdav_validating: "Validating WebDAV...",
    webdav_verified: "WebDAV verified",
    webdav_verify_err: "WebDAV validation failed",
    webdav_missing_config: "Please fill in the WebDAV URL, username, and password.",
    webdav_syncing: "Syncing to WebDAV...",
    webdav_sync_ok: "Sync completed",
    webdav_sync_err: "Sync failed",
    webdav_list_err: "Failed to load cloud backups",
    webdav_delete_confirm: "Delete cloud backup: {name}?",
    webdav_delete_ok: "Cloud backup deleted",
    webdav_delete_err: "Failed to delete cloud backup",
    webdav_restore_confirm: "Restore local data from cloud backup: {name}?",
    webdav_restoring: "Restoring from WebDAV...",
    webdav_logout: "Sign out of WebDAV",
    webdav_logout_confirm: "Sign out of WebDAV and remove the saved local account info?",
    webdav_logout_ok: "Signed out of WebDAV",
    webdav_timeout: "WebDAV request timed out. Check the network or server status.",
    sync_restore_ok: "✅ Restored {count} account(s) from cloud sync!",
    sync_restore_err: "Cloud restore failed. The archive or data file is invalid."
});

Object.assign(I18N_DATA.es, {
    nav_webdav: "Sincronización WebDAV",
    webdav_account: "Cuenta WebDAV",
    webdav_config: "Configurar",
    webdav_not_configured: "WebDAV aún no está configurado",
    webdav_connected_as: "Cuenta actual: {user}",
    webdav_url: "URL del servidor",
    webdav_url_placeholder: "Ejemplo: https://dav.example.com/remote.php/dav/files/user",
    webdav_username: "Usuario",
    webdav_username_placeholder: "Introduce el usuario de WebDAV",
    webdav_password: "Contraseña",
    webdav_password_placeholder: "Introduce la contraseña de WebDAV",
    webdav_verify_save: "Verificar y guardar",
    webdav_sync: "Sincronización en la nube",
    webdav_sync_now: "Respaldar",
    webdav_refresh: "Actualizar lista",
    webdav_backup_list: "Lista de copias en la nube",
    webdav_restore: "Restaurar",
    webdav_delete: "Eliminar",
    webdav_no_backups: "Todavía no hay copias en la nube",
    webdav_need_config: "Primero completa y verifica la configuración de WebDAV.",
    webdav_loading: "Cargando copias en la nube...",
    webdav_validating: "Validando WebDAV...",
    webdav_verified: "WebDAV verificado",
    webdav_verify_err: "La validación de WebDAV falló",
    webdav_missing_config: "Completa la URL, el usuario y la contraseña de WebDAV.",
    webdav_syncing: "Sincronizando con WebDAV...",
    webdav_sync_ok: "Sincronización completada",
    webdav_sync_err: "La sincronización falló",
    webdav_list_err: "No se pudieron cargar las copias en la nube",
    webdav_delete_confirm: "¿Eliminar la copia en la nube: {name}?",
    webdav_delete_ok: "Copia en la nube eliminada",
    webdav_delete_err: "No se pudo eliminar la copia en la nube",
    webdav_restore_confirm: "¿Restaurar los datos locales desde la copia en la nube: {name}?",
    webdav_restoring: "Restaurando desde WebDAV...",
    webdav_logout: "Cerrar sesión de WebDAV",
    webdav_logout_confirm: "¿Cerrar sesión de WebDAV y eliminar la información guardada localmente?",
    webdav_logout_ok: "WebDAV desconectado",
    webdav_timeout: "La solicitud de WebDAV agotó el tiempo de espera. Revisa la red o el servidor.",
    sync_restore_ok: "✅ Se restauraron {count} cuenta(s) desde la sincronización en la nube.",
    sync_restore_err: "La restauración en la nube falló. El archivo comprimido o los datos no son válidos."
});


    // Shadow DOM CSS
export const STYLE_CSS = `
        :host {
            all: initial; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif!important;font-size: 14px!important;line-height: 1.5;color: #333!important;z-index: 2147483647; position: fixed;
            top: 0;left: 0;width: 0;height: 0;pointer-events: none;
        }

        * { box-sizing: border-box; }
        a { text-decoration:none; }

        #acc-mgr-fab, .acc-panel, .acc-dialog-mask { pointer-events: auto; }
        #acc-mgr-fab { padding: 10px;position: fixed; bottom: 100px; right: 30px; width: 44px; height: 44px; background: #2196F3; color: white; border-radius: 50%; display: none; align-items: center; justify-content: center; font-size: 20px; cursor: move; z-index: 1000000; box-shadow: 0 8px 30px rgba(0,0,0,0.25); user-select: none; border: none; touch-action: none; transition: transform 0.1s; }
        #acc-mgr-fab:active { transform: scale(0.95); }

        .acc-panel { position: fixed; width: 340px; background: white; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); z-index: 1000001; display: flex; flex-direction: column; font-family: inherit; border: 1px solid #ddd; overflow: hidden; height: 480px; overscroll-behavior: none !important; opacity: 0; visibility: hidden; transition: opacity 0.12s ease, visibility 0.12s ease; pointer-events: none; }
        .acc-panel.show { opacity: 1; visibility: visible; pointer-events: auto; }
        .acc-header { display: flex; align-items: center; justify-content: center; padding: 8px 15px; border-bottom: 1px solid #eee; background: #fff; position: relative; flex-shrink: 0; min-height: 44px; }
        .acc-header-actions { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); display: none; gap: 6px; align-items: center; }
        .acc-header-right-actions { position:absolute; right:15px; top:50%; transform:translateY(-50%); display:flex; gap:6px; align-items:center; }
        .acc-header-title { font-size: 14px; font-weight: bold; color: #333; text-align: center; }
        #acc-close-btn { cursor: pointer; color: #ccc; font-size: 16px; padding: 5px; transition: color 0.2s; line-height:1; }
        #acc-close-btn:hover { color: #666; }

        .acc-tab-content { flex: 1; display: none; padding: 15px 15px 0 15px; overflow: hidden; flex-direction: column; background: #fff; }
        .acc-tab-content.active { display: flex; }
        .acc-mgr-toolbar { display:flex; gap:8px; margin-bottom:10px; align-items:center; min-height:30px; }
        .acc-mgr-host-row { display:flex; gap:5px; align-items:center; flex:1; min-width:0; position:relative; min-height:30px; }
        .acc-host-picker { position:relative; flex:1; min-width:0; min-height:30px; }
        .acc-host-search-input { display:none; width:100%; height:30px; box-sizing:border-box; border:1px solid #e4e8ee; border-radius:6px; padding:7px 10px; font-size:12px; outline:none; color:#333; background:#fff; }
        .acc-host-search-input:focus { border-color:#2196F3; box-shadow:0 0 0 2px rgba(33, 150, 243, 0.12); }
        .acc-host-picker.open .acc-host-trigger { display:none; }
        .acc-host-picker.open .acc-host-search-input { display:block; }
        .acc-account-search-box { display:none; flex:1; min-width:0; min-height:30px; }
        .acc-mgr-host-row.searching .acc-host-picker { display:none; }
        .acc-mgr-host-row.searching .acc-account-search-box { display:block; }
        .acc-host-trigger { width:100%; min-width:0; height:30px; box-sizing:border-box; padding:6px 28px 6px 10px; font-size:12px; border:1px solid #eee; border-radius:4px; outline:none; cursor:pointer; background:#fff; color:#333; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; position:relative; }
        .acc-host-trigger::after { content:""; position:absolute; right:10px; top:50%; width:7px; height:7px; border-right:1.5px solid currentColor; border-bottom:1.5px solid currentColor; transform:translateY(-65%) rotate(45deg); opacity:0.7; transition:transform 0.15s ease; }
        .acc-host-picker.open .acc-host-trigger { border-color:#2196F3; box-shadow:0 0 0 2px rgba(33, 150, 243, 0.12); }
        .acc-host-picker.open .acc-host-trigger::after { transform:translateY(-30%) rotate(225deg); }
        .acc-host-menu { position:absolute; top:calc(100% + 4px); left:0; right:0; background:#fff; border:1px solid #e4e8ee; border-radius:8px; box-shadow:0 10px 24px rgba(15, 23, 42, 0.12); padding:6px; display:none; max-height:320px; overflow:hidden; z-index:20; }
        .acc-host-picker.open .acc-host-menu { display:block; }
        .acc-account-search-input { width:100%; height:30px; box-sizing:border-box; border:1px solid #e4e8ee; border-radius:6px; padding:7px 10px; font-size:12px; outline:none; color:#333; background:#fff; }
        .acc-account-search-input:focus { border-color:#2196F3; box-shadow:0 0 0 2px rgba(33, 150, 243, 0.12); }
        .acc-host-list { max-height:266px; overflow-y:auto; }
        .acc-host-list::-webkit-scrollbar { width:6px; }
        .acc-host-list::-webkit-scrollbar-thumb { background:#d3d9e2; border-radius:999px; }
        .acc-host-option-row { display:flex; align-items:center; gap:6px; border-radius:6px; flex-wrap:wrap; }
        .acc-host-option-row:hover { background:#f2f8fd; }
        .acc-host-option-row.active { background:#e3f2fd; }
        .acc-host-option { flex:1; min-width:0; border:none; background:transparent; color:#333; display:flex; align-items:center; gap:6px; padding:8px 10px; border-radius:6px; cursor:pointer; font-size:12px; text-align:left; }
        .acc-host-option-row:hover .acc-host-option { color:#2196F3; }
        .acc-host-option-row.active .acc-host-option { color:#1976D2; font-weight:600; }
        .acc-host-edit-link,
        .acc-host-open-link { flex-shrink:0; margin-right:10px; border:none; background:transparent; color:#7d93a8; font-size:12px; line-height:1; cursor:pointer; padding:0; opacity:0; visibility:hidden; text-decoration:underline; text-underline-offset:2px; transition:color 0.15s ease, opacity 0.15s ease; }
        .acc-host-edit-link { margin-right:0; text-decoration:none; display:flex; align-items:center; justify-content:center; width:18px; height:18px; }
        .acc-host-edit-link svg { font-size:13px; }
        .acc-host-option-row:hover .acc-host-edit-link,
        .acc-host-option-row:hover .acc-host-open-link,
        .acc-host-edit-link:focus-visible,
        .acc-host-open-link:focus-visible { opacity:1; visibility:visible; }
        .acc-host-edit-link:hover,
        .acc-host-edit-link:focus-visible,
        .acc-host-open-link:hover,
        .acc-host-open-link:focus-visible { color:#2196F3; outline:none; }
        .acc-host-edit-box { width:100%; display:flex; gap:6px; padding:0 8px 8px 8px; }
        .acc-host-edit-input { flex:1; min-width:0; border:1px solid #d9e2ec; border-radius:6px; padding:6px 8px; font-size:12px; outline:none; background:#fff; }
        .acc-host-edit-input:focus { border-color:#2196F3; box-shadow:0 0 0 2px rgba(33, 150, 243, 0.12); }
        .acc-host-edit-save,
        .acc-host-edit-cancel { border:1px solid #d9e2ec; background:#fff; color:#475467; border-radius:6px; padding:0 8px; font-size:12px; cursor:pointer; }
        .acc-host-edit-save:hover,
        .acc-host-edit-cancel:hover { border-color:#2196F3; color:#2196F3; background:#f5fbff; }
        .acc-host-empty { padding:10px; font-size:12px; color:#8a94a3; text-align:center; }
        .acc-toolbar-btn { width:30px; height:30px; border:1px solid #ddd; background:#fff; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#555; padding:0; transition:0.2s; }
        .acc-toolbar-btn svg { font-size:16px; }
        .acc-toolbar-btn:hover { background:#e3f2fd; border-color:#2196F3; color:#2196F3; }

        .acc-scroll-area { flex: 1; overflow-y: auto; padding-right: 4px; margin-top: 2px; overscroll-behavior: contain;}
        .acc-scroll-area::-webkit-scrollbar { width: 4px; }
        .acc-scroll-area::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }

        /* --- Customized Elements --- */
        .acc-backup-row { display: flex; gap: 8px; margin-bottom: 10px; justify-content: space-between; }
        .acc-icon-btn { flex: 1; height: 38px; padding: 0; border-radius: 6px; border: 1px solid #eee; background: #f9f9f9; cursor: pointer; font-size: 18px; transition: 0.2s; display: flex; align-items: center; justify-content: center; color: #555; }
        .acc-icon-btn:hover { background: #e3f2fd; border-color: #2196F3; color:#2196F3}
        .acc-icon-btn.danger:hover { background: #ffebee; border-color: #f44336; color: #f44336; }

        .acc-about-content { padding: 5px; color: #444 !important; font-size: 13px !important; line-height: 1.6 !important; text-align: left !important; }
        .acc-about-header { text-align: center !important; margin-bottom: 20px !important; }
        .acc-about-logo { font-size: 20px !important; display: inline-flex !important; margin-bottom: 5px !important; }
        .acc-about-name { font-weight: bold !important; font-size: 16px !important; color: #333 !important; }
        .acc-about-ver { color: #999 !important; font-size: 12px !important; }
        .acc-about-item { display: flex !important; justify-content: space-between !important; padding: 3px 0 !important; border-bottom: 1px solid #f5f5f5 !important; }
        .acc-about-label { color: #888 !important; font-weight: bold !important; }

        /* Custom Dialog UI */
        .acc-dialog-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 2000007; display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
        .acc-dialog-box { background: white; width: 280px; border-radius: 12px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); animation: accPop 0.05s ease-out; display: flex; flex-direction: column; }
        @keyframes accPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .acc-dialog-msg { font-size: 14px; color: #333; margin-bottom: 20px; line-height: 1.5; text-align: center; white-space: pre-wrap; font-weight: 500; }
        .acc-dialog-footer { display: flex; gap: 10px; }
        .acc-dialog-btn { flex: 1; padding: 8px 0; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.1s; }
        .acc-dialog-btn-ok { background: #2196F3; color: white; }
        .acc-dialog-btn-ok:hover { background: #1976D2; }
        .acc-dialog-btn-cancel { background: #f5f5f5; color: #666; }
        .acc-dialog-btn-cancel:hover { background: #e0e0e0; }
        .acc-form-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 2000006; display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
        .acc-form-box { background: white; width: 300px; border-radius: 12px; padding: 18px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 10px; animation: accPop 0.05s ease-out; }
        .acc-form-title { font-size: 14px; font-weight: 700; color: #333; }
        .acc-form-label { font-size: 12px; font-weight: 700; color: #667085; margin-bottom: -4px; }
        .acc-form-footer { display: flex; gap: 10px; margin-top: 4px; }
        .acc-toast { position:absolute; top:12px; left:50%; transform:translateX(-50%) translateY(-8px); display:flex; align-items:center; gap:6px; max-width:260px; padding:7px 10px; border:1px solid #d7e5f5; border-radius:999px; background:rgba(255,255,255,0.96); color:#36506b; box-shadow:0 10px 24px rgba(15, 23, 42, 0.12); font-size:12px; line-height:1; opacity:0; visibility:hidden; transition:opacity 0.18s ease, transform 0.18s ease; z-index:2000012; pointer-events:none; white-space:nowrap; }
        .acc-toast.show { opacity:1; visibility:visible; transform:translateX(-50%) translateY(0); }
        .acc-toast-icon { width:14px; height:14px; display:flex; align-items:center; justify-content:center; color:#2196F3; flex-shrink:0; }
        .acc-toast-icon svg { font-size:14px; }
        .acc-toast-text { overflow:hidden; text-overflow:ellipsis; }

        /* Others ... */
        .acc-switch-item { display:flex; align-items:stretch; gap:2px; margin-bottom:8px; position:relative; }
        .acc-switch-card { flex:1; min-width:0; padding: 12px; padding-right: 40px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; transition: 0.2s; position: relative; background: #fff; }
        .acc-switch-card:hover { border-color: #2196F3; }
        .acc-switch-card:hover .acc-card-name svg {fill: #2196F3 !important;stroke: #2196F3 !important;transition: all 0.2s ease;}
        .acc-switch-card-static { cursor: default; }
        .acc-switch-handle { width:6px; flex-shrink:0; align-self:stretch; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; color:#c4c4c4; font-size:9px; font-weight:700; user-select:none; cursor:grab; line-height:1; border-radius:4px; padding:0; opacity:0; visibility:hidden; pointer-events:none; transition:opacity 0.15s ease, color 0.15s ease, background 0.15s ease; }
        .acc-switch-handle span { display:block; letter-spacing:0; }
        .acc-switch-item:hover .acc-switch-handle,
        .acc-switch-item.dragging-source .acc-switch-handle { color:#2196F3; background:#f2f8fd; opacity:1; visibility:visible; pointer-events:auto; }
        .acc-switch-ghost { box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18); opacity: 0.96; }
        .acc-switch-item.dragging-source .acc-switch-card { border:1px dashed #2196F3; opacity:0.45; background:#fff; }
        .acc-switch-list-sorting .acc-switch-card:hover { border-color:#eee; background:#fff; }
        .acc-switch-list-sorting .acc-switch-card:hover .acc-card-name svg { fill: currentColor !important; stroke: currentColor !important; }
        .acc-switch-settings-btn { position:absolute; right:8px; bottom:8px; width:24px; height:24px; border:1px solid #ddd; border-radius:6px; background:transparent; color:#7d93a8; display:flex; align-items:center; justify-content:center; padding:0; cursor:pointer; opacity:0; visibility:hidden; transition:all 0.15s ease; }
        .acc-switch-settings-btn svg { font-size:14px; }
        .acc-switch-item:hover .acc-switch-settings-btn,
        .acc-switch-settings-btn:focus-visible { opacity:1; visibility:visible; }
        .acc-switch-settings-btn:hover,
        .acc-switch-settings-btn:active,
        .acc-switch-settings-btn:focus-visible { color:#2196F3; border-color:#2196F3; background:#e3f2fd; }
        .acc-card-body { flex:1; min-width:0; }
        .acc-card-name { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: #333; min-width:0; }
        .acc-card-name-icon { flex-shrink:0; display:flex; align-items:center; justify-content:center; color:inherit; background:transparent; border:none; padding:0; cursor:pointer; transition:color 0.15s ease; }
        .acc-card-name-icon:hover,
        .acc-card-name-icon:focus-visible { color:#2196F3; outline:none; }
        .acc-card-name-text { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .acc-card-meta { font-size: 10px; color: #999; display: flex; flex-wrap: wrap; gap: 4px; }
        .acc-mini-tag { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; color: #777; transition: all 0.2s; border: 1px solid transparent; }
        .acc-click-tag { cursor: pointer; text-decoration: none; position: relative; }
        .acc-click-tag:hover { background: #2196F3; color: white; border-color: #1976D2; z-index: 2; }

        .acc-row-btn { display: flex; gap: 8px; align-items: center; margin-bottom:3px}
        .acc-input-text { flex: 1; width:100%; padding: 8px; margin-bottom:8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; box-sizing: border-box; background: #fff; color: #333; outline: none; transition: all 0.2s; }
        .acc-input-text:focus { border-color: #2196F3; box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); }
        .acc-btn { border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 5px; transition: 0.2s; }
        .acc-btn-blue { flex: 1; background: #2196F3; color: white; }
        .acc-btn-danger { width:100%; background:#ffebee; color:#c62828; border:1px solid #ffcdd2; }
        .acc-btn-danger:hover { background:#ffcdd2; border-color:#ef9a9a; }
        .acc-help-tip, .acc-lock-tip { display: inline-block; width: 16px; height: 16px; line-height: 16px; text-align: center; cursor: help; font-size: 16px; }
        .acc-help-tip { color:#f5a623; margin-left:10px; margin-right:4px}
        .acc-lock-tip { color: #999; }
        .acc-set-group { margin-bottom: 10px; }
        .acc-set-title { font-size: 12px; font-weight: bold; color: #999; margin-bottom: 8px; }
        .acc-set-row { display: flex; gap: 10px; margin-bottom: 10px; padding: 0 3px;}
        .acc-btn-light { background: #f5f5f5; color: #333; flex: 1; border: 1px solid #eee; }
        .acc-btn-light:hover { background: #e0e0e0; }
        .acc-btn-active { background: #2196F3 !important; color: white !important; border-color: #2196F3 !important; }
        .acc-notice-content { line-height: 1.6; color: #444; font-size: 13px; }
        .acc-notice-content h4 { margin: 15px 0 8px 0; color: #333; border-left: 3px solid #2196F3; padding-left: 8px; }
        .acc-link-btn { color: #2196F3; cursor: pointer; font-size: 12px; }
        .acc-select-ui { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; background: #fff; cursor: pointer; outline: none; color: #333; }
        .acc-chk {display:flex; align-items:center; flex-wrap:wrap; font-size:11px; color:#666; margin:5px 0;-webkit-user-select: none;}
        .acc-chk-label { display: inline-flex !important; align-items: center !important; cursor: pointer !important; margin-right:4px; font-size: 12px; color: #666; }
        .acc-chk-label.disabled { opacity: 0.45; cursor: not-allowed !important; }
        .acc-custom-chk { appearance: none !important; width: 14px !important; height: 14px !important; border: 1px solid #ccc !important; border-radius: 3px !important; margin-right: 4px !important; cursor: pointer !important; position: relative !important; background: #fff; }
        .acc-custom-chk:disabled { cursor: not-allowed !important; background: #f3f4f6 !important; border-color: #d0d5dd !important; }
        .acc-custom-chk:checked { background-color: #2196F3 !important; border-color: #2196F3 !important; }
        .acc-custom-chk:checked::after { content: ''; position: absolute !important; left: 4px !important; top: 1px !important; width: 3px !important; height: 7px !important; border: solid white !important; border-width: 0 2px 2px 0 !important; transform: rotate(45deg) !important; }

        .acc-loading-mask{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.7);backdrop-filter:blur(2px);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:2000010;border-radius:12px}
        .acc-spinner{width:30px;height:30px;border:3px solid #f3f3f3;border-top:3px solid #2196F3;border-radius:50%;animation:acc-spin 1s linear infinite}
        @keyframes acc-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
        .acc-loading-text{margin-top:10px;font-size:12px;color:#2196F3;font-weight:700}
        .acc-webdav-list { display:flex; flex-direction:column; gap:8px; }
        .acc-webdav-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .acc-webdav-status-row { display:flex; align-items:center; gap:6px; }
        .acc-webdav-status { font-size:12px; color:#667085; }
        .acc-webdav-logout-btn { width:24px; height:24px; min-width:24px; }
        .acc-webdav-logout-btn:disabled { opacity:.5; cursor:not-allowed; }
        .acc-webdav-config-btn { flex:0 0 auto; padding:8px 12px; }
        .acc-webdav-item { border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#fff; display:flex; flex-direction:column; gap:8px; position:relative; }
        .acc-webdav-item-main { min-width:0; }
        .acc-webdav-item-name { font-size:12px; font-weight:700; color:#344054; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .acc-webdav-item-meta { display:flex; gap:4px; flex-wrap:wrap; margin-top:4px; }
        .acc-webdav-meta-tag { font-size:10px; padding:0 4px; line-height:16px; }
        .acc-webdav-item-actions { position:absolute; right:8px; bottom:8px; display:flex; gap:6px; opacity:0; visibility:hidden; transition:opacity .15s ease; }
        .acc-webdav-item:hover .acc-webdav-item-actions,
        .acc-webdav-item-actions:focus-within { opacity:1; visibility:visible; }
        .acc-webdav-action-btn { width:24px; height:24px; min-width:24px; }
        .acc-webdav-action-btn svg { font-size:14px; }
        .acc-webdav-action-btn.danger { color:#c62828; border-color:#ffcdd2; background:#fff5f5; }
        .acc-webdav-action-btn.danger:hover { background:#ffebee; border-color:#ef9a9a; color:#c62828; }
        .acc-webdav-empty { padding:14px 10px; color:#98a2b3; text-align:center; font-size:12px; border:1px dashed #d0d5dd; border-radius:8px; background:#fafafa; }

    `;

    // ========================================================================
    // 2. Global State & Utils
    // ========================================================================
