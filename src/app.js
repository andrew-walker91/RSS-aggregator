import * as yup from 'yup';
import onChange from 'on-change';

const render = (elements) => (path, value) => {
  elements.input.classList.remove('is-invalid');
  elements.feedback.classList.remove('text-success', 'text-danger');
  elements.feedback.textContent = '';

  switch (path) {
    case 'urls':
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = 'RSS успешно загружен';
      break;

    case 'form.url':
      elements.input.value = value;
      break;

    case 'form.error':
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = value.message;
      break;

    default:
      break;
  }
};

export default () => {
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
    render(elements)
  );

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const url = formData.get('url').trim();

    state.form.url = url;

    const schema = yup.string().url().notOneOf(state.urls);

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
