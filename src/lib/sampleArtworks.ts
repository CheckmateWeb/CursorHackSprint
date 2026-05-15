/** Procedural sample paintings as data URLs for demo without external assets */
export const SAMPLE_ARTWORKS = [
  {
    id: 'starry',
    name: 'Starry Reverie',
    url: createGradientArt([
      ['#0b1026', 0],
      ['#1a237e', 0.35],
      ['#3949ab', 0.55],
      ['#ffd54f', 0.75],
      ['#1b5e20', 1],
    ]),
  },
  {
    id: 'sunset',
    name: 'Golden Hour',
    url: createGradientArt([
      ['#1a0a2e', 0],
      ['#c62828', 0.4],
      ['#ff6f00', 0.65],
      ['#ffca28', 0.85],
      ['#4e342e', 1],
    ]),
  },
  {
    id: 'waterlily',
    name: 'Pond Dreams',
    url: createGradientArt([
      ['#4a148c', 0],
      ['#7b1fa2', 0.3],
      ['#4db6ac', 0.55],
      ['#81c784', 0.75],
      ['#1b5e20', 1],
    ]),
  },
  {
    id: 'winter',
    name: 'Silent Frost',
    url: createGradientArt([
      ['#263238', 0],
      ['#546e7a', 0.4],
      ['#b0bec5', 0.7],
      ['#eceff1', 0.9],
      ['#37474f', 1],
    ]),
  },
];

function createGradientArt(stops: [string, number][]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 600);
  stops.forEach(([color, pos]) => grad.addColorStop(pos, color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 800, Math.random() * 300, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
    ctx.lineWidth = Math.random() * 30 + 10;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 800, 350 + Math.random() * 200);
    ctx.bezierCurveTo(
      Math.random() * 800,
      400,
      Math.random() * 800,
      500,
      Math.random() * 800,
      580,
    );
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}
