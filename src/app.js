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
  .then((response) => {
    const responseData = response.data.contents;
    return responseData;
  })
  .catch(() => { throw new Error('networkError'); });

const addPosts = (feedId, items, state) => {
  const posts = items.map((item) => ({
    feedId,
    id: uniqueId(),
    ...item,
  }));
  state.posts = posts.concat(state.posts);
};

const trackUpdates = (feedIds, state, timeout = 5000) => {
  const inner = () => {
    const promises = state.feeds.map((feed) => getHttpContents(feed.link)
      .then(parseRSS)
      .catch((error) => ({ error })));

    Promise.allSettled(promises)
      .then((results) => results.forEach((result, index) => {
        const parsedRSS = result.status === 'fulfilled' ? result.value : null;
        const feedId = state.feeds[index].id;

        if (!parsedRSS) return;

        const postsUrls = state.posts
          .filter((post) => feedId === post.feedId)
          .map(({ link }) => link);
        const newItems = parsedRSS.items.filter(({ link }) => !postsUrls.includes(link));

        if (newItems.length > 0) {
          addPosts(feedId, newItems, state);
        }
      }))
      .catch((error) => console.error(error))
      .then(() => setTimeout(inner, timeout));
  };
  setTimeout(inner, timeout);
};

export default () => {
  const defaultLanguage = 'ru';

  const i18nInstance = i18next.createInstance();

  setLocale({
    mixed: { default: 'default', notOneOf: 'exist' },
    string: { url: 'url' },
  });

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

      trackUpdates(state.feeds, state);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();

        state.form.error = '';

        const urlsList = state.feeds.map(({ link }) => link);

        const schema = string().url().notOneOf(urlsList);

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
