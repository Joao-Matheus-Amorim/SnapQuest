export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const clone = obj => JSON.parse(JSON.stringify(obj));

export const fakePhotos = [
  'linear-gradient(135deg,#ffd166,#ef476f)',
  'linear-gradient(135deg,#7aa2ff,#c084fc)',
  'linear-gradient(135deg,#79f2c0,#118ab2)',
  'linear-gradient(135deg,#fca5a5,#fbbf24)',
  'linear-gradient(135deg,#a7f3d0,#93c5fd)',
  'linear-gradient(135deg,#f0abfc,#818cf8)',
];

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

export function mockPhoto(label = 'Snap') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#ffd166"/>
          <stop offset="1" stop-color="#7aa2ff"/>
        </linearGradient>
      </defs>
      <rect width="900" height="900" fill="url(#g)"/>
      <circle cx="280" cy="260" r="160" fill="rgba(255,255,255,.22)"/>
      <circle cx="620" cy="610" r="190" fill="rgba(255,255,255,.16)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="96" fill="white">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
