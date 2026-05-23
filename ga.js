(function() {
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-87TZEFJY6F';
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-87TZEFJY6F');
  // クイズページのみ quiz-analytics.js を読み込む
  if (/\/quiz-/.test(window.location.pathname)) {
    var analytics = document.createElement('script');
    analytics.type = 'module';
    analytics.src = (document.currentScript
      ? document.currentScript.src.replace(/ga\.js.*$/, '')
      : './') + 'quiz-analytics.js';
    document.head.appendChild(analytics);
  }
})();
