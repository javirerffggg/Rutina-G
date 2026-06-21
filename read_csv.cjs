const Tesseract = require('tesseract.js');
const fs = require('fs');

async function main() {
  const file1 = '/home/javier/.gemini/antigravity/brain/5e0da0d3-c58d-489b-8437-e8511e95d52f/media__1782063609269.png';
  const file2 = '/home/javier/.gemini/antigravity/brain/5e0da0d3-c58d-489b-8437-e8511e95d52f/media__1782063635431.png';
  
  if (fs.existsSync(file1)) {
    const { data: { text } } = await Tesseract.recognize(file1, 'eng');
    console.log("=== FILE 1 ===");
    console.log(text);
  }
  if (fs.existsSync(file2)) {
    const { data: { text } } = await Tesseract.recognize(file2, 'eng');
    console.log("=== FILE 2 ===");
    console.log(text);
  }
}
main();
