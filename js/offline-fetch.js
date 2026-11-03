/* 인터넷 없이(파일로 직접) 열 때: 크롬은 file:// 주소에 fetch 를 막으므로 XHR 로 대신 읽어 줌 */
(() => {
  if (location.protocol !== 'file:') return;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (/^(https?:|data:|blob:)/i.test(url)) return orig(input, init);
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest(); x.open('GET', url, true); x.responseType = 'arraybuffer';
      x.onload = () => resolve(new Response(x.response, { status: 200 }));
      x.onerror = () => reject(new TypeError('Failed to fetch: ' + url));
      x.send();
    });
  };
})();
