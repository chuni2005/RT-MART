import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhTW_auth from './i18n/zh-TW/auth.json';
import en_auth from './i18n/en/auth.json';

i18n.use(initReactI18next).init({
    resources: {
        'zh-TW': {
            auth: zhTW_auth,
        },
        en: {
            auth: en_auth,
        }
    },
    lng: 'zh-TW',        // 預設語言
    fallbackLng: 'en',
    ns: ['auth'],
    defaultNS: 'auth',
    interpolation: {
        escapeValue: false
    }
});

export default i18n;
