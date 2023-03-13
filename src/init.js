import { string } from 'yup';
import onChange from 'on-change';
import render from './render.js';

export default (i18nInstance) => {
  const elements = {
    input: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    example: document.querySelector('.text-muted'),
    feedback: document.querySelector('.feedback'),
  };

  const state = onChange(
    {
      form: {
        url: null,
        error: {},
      },
      urls: [],
    },
    render(elements, i18nInstance)
  );

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get('url').trim();

    state.form.url = url;

    const schema = string().url().notOneOf(state.urls);

    schema
      .validate(state.form.url)
      .then(() => {
        state.urls.push(state.form.url);
        state.form.url = null;
      })
      .catch((error) => (state.form.error = error))
      .finally(() => elements.input.focus());
  });
};
