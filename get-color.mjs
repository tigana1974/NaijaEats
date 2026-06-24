import Jimp from 'jimp';

async function main() {
  try {
    const image = await Jimp.read('public/favicon.ico');
    const counts = {};
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];
      
      if (a > 200) {
        const isWhite = r > 240 && g > 240 && b > 240;
        const isBlack = r < 15 && g < 15 && b < 15;
        if (!isWhite && !isBlack) {
          const hex = \`#\${r.toString(16).padStart(2, '0')}\${g.toString(16).padStart(2, '0')}\${b.toString(16).padStart(2, '0')}\`;
          counts[hex] = (counts[hex] || 0) + 1;
        }
      }
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log("Most common colors:", sorted.slice(0, 5));
  } catch(e) {
    console.error(e);
  }
}
main();
