import onChange from 'on-change';
import { uniqueId } from 'lodash';
import i18next from 'i18next';
import axios from 'axios';
import { string, setLocale } from 'yup';
import resources from './locales/index.js';
import render from './render.js';
import parseRSS from './utils/parser.js';

const getAllOriginsResponse = (url) => {
  const allOriginsLink = 'https://allorigins.hexlet.app/get';

  const workingUrl = new URL(allOriginsLink);

  workingUrl.searchParams.set('disableCache', 'true');
  workingUrl.searchParams.set('url', url);

  return axios.get(workingUrl);
};

const getHttpContents = (url) => getAllOriginsResponse(url)
  .catch(() => Promise.reject(new Error('networkError')))
  .then((response) => {
    const responseData = response.data.contents;
    return Promise.resolve(responseData);
  });

const addPosts = (feedId, items, state) => {
  const posts = items.map((item) => ({
    feedId,
    id: uniqueId(),
    ...item,
  }));
  state.posts = posts.concat(state.posts);
};

const trackUpdates = (feedId, state, timeout = 5000) => {
  const feed = state.feeds.find(({ id }) => feedId === id);

  const inner = () => getHttpContents(feed.link)
    .then(parseRSS)
    .then((parsedRSS) => {
      const postsUrls = state.posts
        .filter((post) => feedId === post.feedId)
        .map(({ link }) => link);
      const newItems = parsedRSS.items.filter(({ link }) => !postsUrls.includes(link));

      if (newItems.length > 0) {
        addPosts(feedId, newItems, state);
      }
    })
    .finally(() => {
      setTimeout(inner, timeout);
    });

  setTimeout(inner, timeout);
};

export default () => {
  const defaultLanguage = 'ru';

  setLocale({
    mixed: { default: 'default', notOneOf: 'exist' },
    string: { url: 'url' },
  });

  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: defaultLanguage,
      debug: true,
      resources,
    })
    .then(() => {
      const elements = {
        form: document.querySelector('.rss-form'),
        input: document.querySelector('#url-input'),
        example: document.querySelector('.text-muted'),
        feedback: document.querySelector('.feedback'),
        submit: document.querySelector('button[type="submit"]'),
        feeds: document.querySelector('.feeds'),
        posts: document.querySelector('.posts'),
        modal: {
          modalElement: document.querySelector('.modal'),
          title: document.querySelector('.modal-title'),
          body: document.querySelector('.modal-body'),
          showFull: document.querySelector('.full-article'),
        },
      };

      const initialState = {
        form: {
          state: 'filling',
          url: '',
          error: '',
        },

        feeds: [],
        posts: [],
        seenIds: new Set(),

        modal: {
          title: '',
          description: '',
          link: '',
        },
      };

      const state = onChange(initialState, render(elements, initialState, i18nInstance));

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();

        state.form.error = '';

        const getUrlsList = state.feeds.map(({ link }) => link);

        const schema = string().url().notOneOf(getUrlsList);

        schema
          .validate(state.form.url)
          .then(() => {
            state.form.state = 'sending';

            return getHttpContents(state.form.url);
          })
          .then(parseRSS)
          .then((parsedRSS) => {
            const feedId = uniqueId();

            const feed = {
              id: feedId,
              title: parsedRSS.title,
              description: parsedRSS.description,
              link: state.form.url,
            };

            state.feeds.push(feed);

            addPosts(feedId, parsedRSS.items, state);
            trackUpdates(feedId, state);

            state.form.url = '';
          })
          .catch((error) => {
            const message = error.message ?? 'default';
            state.form.error = message;
          })
          .finally(() => {
            state.form.state = 'filling';
          });
      });

      elements.input.addEventListener('change', (e) => {
        state.form.url = e.target.value.trim();
      });

      elements.modal.modalElement.addEventListener('show.bs.modal', (e) => {
        const postId = e.relatedTarget.getAttribute('data-id');
        const post = state.posts.find(({ id }) => postId === id);

        const { title, description, link } = post;

        state.seenIds.add(postId);
        state.modal = { title, description, link };
      });
    });
};
