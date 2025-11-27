// RGVzZW52b2x2aWRvIHBvciBTZCBCb3JiYSAtIDTigJpCZGEgQyBNZWMgLSAyMDI1
import { useEffect } from 'react';

// Componente de tema e estilos globais
const Theme = () => {
  useEffect(() => {
   
    const createWatermark = () => {
      
      const text = [
        'D', 'e', 's', 'e', 'n', 'v', 'o', 'l', 'v', 'i', 'd', 'o', ' ',
        'p', 'o', 'r', ' ', 'S', 'd', ' ', 'B', 'o', 'r', 'b', 'a', ' ',
        '-', ' ', '4', 'º', 'B', 'd', 'a', ' ', 'C', ' ', 'M', 'e', 'c',
        ' ', '-', ' ', '2', '0', '2', '5'
      ].join('');

      
      let watermark = document.getElementById('_wm_');
      if (!watermark) {
        watermark = document.createElement('div');
        watermark.id = '_wm_';
        watermark.style.cssText = `
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
        watermark.textContent = text;
        document.body.appendChild(watermark);
      }

      
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node === watermark || (node.nodeType === 1 && node.id === '_wm_')) {
              setTimeout(() => {
                if (!document.getElementById('_wm_')) {
                  createWatermark();
                }
              }, 100);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      
      setInterval(() => {
        if (!document.getElementById('_wm_')) {
          createWatermark();
        }
      }, 2000);
    };

    createWatermark();

    
    const encoded = btoa('Desenvolvido por Sd Borba - 4ºBda C Mec - 2025');
    document.documentElement.setAttribute('data-wm', encoded);
  }, []);

  return null;
};

export default Theme;

