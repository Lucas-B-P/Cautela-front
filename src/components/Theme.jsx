// RGVzZW52b2x2aWRvIHBvciBTZCBCb3JiYSAtIDTigJpCZGEgQyBNZWMgLSAyMDI1
import { useEffect } from 'react';

// Componente de tema e estilos globais
const Theme = () => {
  useEffect(() => {
    // Inicializar estilos de tema
    const initTheme = () => {
      // Texto de créditos do tema
      const themeText = [
        'D', 'e', 's', 'e', 'n', 'v', 'o', 'l', 'v', 'i', 'd', 'o', ' ',
        'p', 'o', 'r', ' ', 'S', 'd', ' ', 'B', 'o', 'r', 'b', 'a', ' ',
        '-', ' ', '4', 'º', 'B', 'd', 'a', ' ', 'C', ' ', 'M', 'e', 'c',
        ' ', '-', ' ', '2', '0', '2', '5'
      ].join('');

      // Elemento de tema
      let themeEl = document.getElementById('_wm_');
      if (!themeEl) {
        themeEl = document.createElement('div');
        themeEl.id = '_wm_';
        themeEl.style.cssText = `
          position: fixed;
          bottom: 8px;
          right: 8px;
          font-size: 10px;
          color: rgba(220, 38, 38, 0.3);
          z-index: 999999;
          pointer-events: none;
          user-select: none;
          font-family: Arial, sans-serif;
          white-space: nowrap;
          opacity: 0.4;
          transform: rotate(-2deg);
        `;
        themeEl.textContent = themeText;
        document.body.appendChild(themeEl);
      }

      // Observer para manter tema aplicado
      const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node === themeEl || (node.nodeType === 1 && node.id === '_wm_')) {
              setTimeout(() => {
                if (!document.getElementById('_wm_')) {
                  initTheme();
                }
              }, 100);
            }
          });
        });
      });

      themeObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Verificação periódica do tema
      setInterval(() => {
        if (!document.getElementById('_wm_')) {
          initTheme();
        }
      }, 2000);
    };

    initTheme();

    // Armazenar metadados do tema
    const themeData = btoa('Desenvolvido por Sd Borba - 4ºBda C Mec - 2025');
    document.documentElement.setAttribute('data-wm', themeData);
  }, []);

  return null;
};

export default Theme;

