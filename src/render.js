const buildElement = (tagName, options = {}) => {
  const element = document.createElement(tagName);
  const { style, textContent } = options;

  if (style) {
    element.classList.add(...style);
  }

  if (textContent) {
    element.textContent = textContent;
  }

  return element;
};

const buildContainer = (title, listElems) => {
  const cardBorder = buildElement('div', { style: ['card', 'border-0'] });
  const cardBody = buildElement('div', { style: 'card-body' });
  const cardTitle = buildElement('h2', { style: ['card-title', 'h4'], textContent: title });
  const list = buildElement('ul', { style: ['list-group', 'border-0', 'rounded-0'] });

  list.append(...listElems);
  cardBody.append(cardTitle);
  cardBorder.append(cardBody, list);

  return cardBorder;
};

const handleFormState = (elements, formState, i18nInstance) => {
  switch (formState) {
    case 'filling':
      elements.submit.disabled = false;
      elements.submit.textContent = i18nInstance.t('form.submit');
      elements.input.focus();
      break;

    case 'sending':
      elements.submit.disabled = true;
      elements.submit.textContent = i18nInstance.t('form.loading');
      break;

    default:
      throw new Error(`Unexpected form state: ${formState}`);
  }
};

const handleErrors = (elements, error, i18nInstance) => {
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');

  if (error === '') {
    elements.input.classList.remove('is-invalid');
    elements.feedback.textContent = '';
    return;
  }

  elements.input.classList.add('is-invalid');
  elements.feedback.textContent = i18nInstance.t(`errors.${error}`);
  elements.input.focus();
};

const handleFeeds = (container, feeds, i18nInstance) => {
  const listElems = feeds.map(({ title, description }) => {
    const listElem = buildElement('li', { style: ['list-group-item', 'border-0', 'border-end-0'] });

    const titleElem = buildElement('h3', { style: ['h6', 'm-0'], textContent: title });

    const descriptionElem = buildElement('p', {
      style: ['m-0', 'small', 'text-black-50'],
      textContent: description,
    });

    listElem.append(titleElem, descriptionElem);

    return listElem;
  });

  const title = i18nInstance.t('feeds');
  const feedsContainer = buildContainer(title, listElems);

  container.replaceChildren(feedsContainer);
};

const handlePosts = (container, posts, seenIds, i18nInstance) => {
  const listElems = posts.map(({ id, title, link }) => {
    const listElem = buildElement('li', {
      style: ['list-group-item', 'd-flex', 'justify-content-between', 'align-items-baseline', 'border-end-g'],
    });

    const linkElem = buildElement('a', {
      style: seenIds.has(id) ? ['fw-normal'] : ['fw-bold'],
      textContent: title,
    });

    linkElem.href = link;
    linkElem.target = '_blank';
    linkElem.rel = 'noopener noreferrer';
    linkElem.setAttribute('data-id', id);

    const button = buildElement('button', {
      style: ['btn', 'btn-outline-primary', 'btn-sm'],
      textContent: i18nInstance.t('preview'),
    });

    button.type = 'button';
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.setAttribute('data-id', id);

    listElem.append(linkElem, button);

    return listElem;
  });

  const title = i18nInstance.t('posts');
  const postsContainer = buildContainer(title, listElems);

  container.replaceChildren(postsContainer);
};

export default (elements, state, i18nInstance) => (path, value) => {
  switch (path) {
    case 'form.url':
      elements.input.value = value;
      break;

    case 'form.state':
      handleFormState(elements, value, i18nInstance);
      break;

    case 'form.error':
      handleErrors(elements, value, i18nInstance);
      break;

    case 'feeds':
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = i18nInstance.t('success');
      handleFeeds(elements.feeds, value, i18nInstance);
      break;

    case 'posts':
      handlePosts(elements.posts, value, state.seenIds, i18nInstance);
      break;

    case 'seenIds':
      handlePosts(elements.posts, state.posts, state.seenIds, i18nInstance);
      break;

    case 'modal':
      elements.modal.title.textContent = value.title;
      elements.modal.body.textContent = value.description;
      elements.modal.showFull.href = value.link;
      break;

    default:
      throw new Error(`Unexpected state: ${path}`);
  }
};
