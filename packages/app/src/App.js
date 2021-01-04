// https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
const isValidUrl = (string) => {
  try {
    new URL(string);
  } catch (_) {
    return false;
  }

  return true;
}

const shortenUrl = () => {
  const el = document.getElementById('url');
  const url = el.value;
  if(!isValidUrl(url)) {
    const errorEl = document.getElementById('error');
    errorEl.innerHTML = `"${url}" is not a valid URL`;
  } else {
    fetch('/', {
      method: 'POST',
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify({ url }),
    })
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error();
      }
    })
    .then((data) => {
      const successEl = document.getElementById('result');
      const url = `${window.origin}${data.shortUrl}`
      successEl.innerHTML = `Your short URL is <a href="${url}" target="_blank">${url}</a>`;
    })
    .catch((error) => {
      const errorEl = document.getElementById('error');
      errorEl.innerHTML = 'An error has happened, please try again later';
    });
  }
}

const App = () => {
  return (
    <>
      <input type='text' id='url' placeholder='Input URL to shorten' />
      <button onClick={shortenUrl}>Shorten</button>
      <div id='result'></div>
      <div id='error'></div>
      <br />
      <br />
      <br />
      <div>
        Check the source code on{' '}
        <a
          href='https://github.com/gjgd/lambda-url-shortener'
          target='_blank'
          rel='noreferrer'
        >
          Github
        </a>
      </div>
      <div>Current version: {process.env.REACT_APP_CURRENT_COMMIT}</div>
    </>
  );
};

export default App;
