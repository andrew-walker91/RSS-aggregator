export default (elements, i18nInstance) => (path, value) => {
  elements.input.classList.remove('is-invalid');
  elements.feedback.classList.remove('text-success', 'text-danger');
  elements.feedback.textContent = '';

  switch (path) {
    case 'urls':
      elements.input.classList.remove('is-invalid');

      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = i18nInstance.t('success');
      break;

    case 'form.url':
      elements.input.value = value;
      break;

    case 'form.error':
      elements.input.classList.add('is-invalid');

      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = i18nInstance.t(value.message);
      break;

    default:
      break;
  }
};
