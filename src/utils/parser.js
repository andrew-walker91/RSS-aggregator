const domParser = new DOMParser();

export default (responseData) => {
  const xmlDocument = domParser.parseFromString(responseData, 'text/xml');
  const rootTagName = xmlDocument.documentElement.tagName.toLowerCase();

  if (rootTagName !== 'rss') throw new Error('noRSS');

  const channel = xmlDocument.querySelector('channel');
  const channelTitle = xmlDocument.querySelector('channel title').textContent;
  const channelDescription = xmlDocument.querySelector('channel description').textContent;

  const itemElements = channel.getElementsByTagName('item');

  const items = [...itemElements].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('channel link').textContent;

    return { title, description, link };
  });

  const parsedData = {
    title: channelTitle,
    description: channelDescription,
    items,
  };

  return parsedData;
};
