import i18next from 'i18next';
import { setLocale } from 'yup';
import init from './init.js';
import resources from './locales/index.js';

export default () => {
  const defaultLanguage = 'ru';

  setLocale({
    mixed: { default: 'errors.default', notOneOf: 'errors.exist' },
    string: { url: 'errors.url' },
  });

  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: defaultLanguage,
      debug: true,
      resources,
    })
    .then(() => init(i18nInstance));
};
