(function () {
    const modes = {
        'Native': null,
        '144 FPS': 1000 / 144,
        '60 FPS': 1000 / 60,
        '20 FPS': 1000 / 20
    };

    let targetInterval = null;
    const originalRaf = window.requestAnimationFrame.bind(window);
    const originalCaf = window.cancelAnimationFrame.bind(window);

    window.requestAnimationFrame = function (cb) {
        if (targetInterval == null) {

            return originalRaf(cb);
        } else {
            const handle = setTimeout(() => {
                cb(performance.now());
            }, targetInterval);
            return handle;
        }
    };
    window.cancelAnimationFrame = function (id) {
        if (targetInterval == null) {
            originalCaf(id);
        } else {
            clearTimeout(id);
        }
    };

    const panel = document.createElement('div');
    panel.style.cssText = `
    position: fixed; bottom: 10px; right: 10px;
    background: rgba(0,0,0,0.6); padding: 8px;
    border-radius: 4px; color: white; font-family: sans-serif;
    z-index: 9999;
  `;
    const title = document.createElement('div');
    title.textContent = 'FPS Simulator';
    title.style.marginBottom = '4px';
    panel.appendChild(title);

    Object.entries(modes).forEach(([label, delay]) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
      margin: 2px; padding: 4px 8px;
      background: #444; border: none; border-radius: 3px;
      color: white; cursor: pointer;
    `;
        btn.onclick = () => {
            targetInterval = delay;
            Array.from(panel.querySelectorAll('button'))
                .forEach(b => b.style.opacity = '0.6');
            btn.style.opacity = '1';
        };
        panel.appendChild(btn);
    });

    document.body.appendChild(panel);

    panel.querySelector('button').click();
})();
