"const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const readline = require('readline');

async function compareImages(img1Path, img2Path, outputPath = 'comparison_result.png') {
  try {
    console.log('Loading images...');
    const img1 = await loadImage(img1Path);
    const img2 = await loadImage(img2Path);
    
    // Resize to same size (use smaller dimensions)
    const width = Math.min(img1.width, img2.width);
    const height = Math.min(img1.height, img2.height);
    
    console.log(`Resizing to ${width}x${height}...`);
    
    // Create canvas for comparison
    const canvas = createCanvas(width * 3 + 20, height + 100);
    const ctx = canvas.getContext('2d');
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw images
    ctx.drawImage(img1, 0, 50, width, height);
    ctx.drawImage(img2, width + 10, 50, width, height);
    
    // Calculate pixel differences
    let differentPixels = 0;
    const threshold = 30;
    
    // Create diff image
    const diffCanvas = createCanvas(width, height);
    const diffCtx = diffCanvas.getContext('2d');
    diffCtx.fillStyle = 'white';
    diffCtx.fillRect(0, 0, width, height);
    
    // Get image data
    const img1Data = ctx.getImageData(0, 50, width, height);
    const img2Data = ctx.getImageData(width + 10, 50, width, height);
    
    // Compare pixels
    for (let i = 0; i < img1Data.data.length; i += 4) {
    const r1 = img1Data.data[i];
    const g1 = img1Data.data[i + 1];
    const b1 = img1Data.data[i + 2];
    
    const r2 = img2Data.data[i];
    const g2 = img2Data.data[i + 1];
    const b2 = img2Data.data[i + 2];
    
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    
    if (diff > threshold) {
      differentPixels++;
      // Draw red pixel on diff canvas
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      diffCtx.fillStyle = 'red';
      diffCtx.fillRect(x, y, 1, 1);
    }
    }
    
    // Draw diff image on comparison canvas
    ctx.drawImage(diffCanvas, width * 2 + 20, 50, width, height);
    
    // Add labels
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('Grafana', 10, 30);
    ctx.fillText('Marketplace', width + 20, 30);
    ctx.fillText('Diff (Red=Different)', width * 2 + 30, 30);
    
    const totalPixels = width * height;
    const diffPercentage = (differentPixels / totalPixels) * 100;
    
    ctx.fillStyle = diffPercentage > 10 ? 'red' : (diffPercentage > 5 ? 'orange' : 'green');
    ctx.fillText(`Difference: ${diffPercentage.toFixed(2)}%`, 10, 80);
    
    // Save comparison
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return {
      diffPercentage,
      differentPixels,
      totalPixels,
      outputPath
    };
  } catch (error) {
    throw new Error(`Error comparing images: ${error.message}`);
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('=== Screenshot Comparison Tool ===');
  console.log('');
  
  const img1Path = await askQuestion('Enter path to Grafana screenshot: ');
  const img2Path = await askQuestion('Enter path to Marketplace screenshot: ');
  const outputPath = await askQuestion('Enter output path (default: comparison_result.png): ') || 'comparison_result.png';
  
  // Check if files exist
  if (!fs.existsSync(img1Path)) {
    console.error(`Error: Grafana screenshot not found: ${img1Path}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(img2Path)) {
    console.error(`Error: Marketplace screenshot not found: ${img2Path}`);
    process.exit(1);
  }
  
  console.log('');
  console.log('Comparing images...');
  
  try {
    const result = await compareImages(img1Path, img2Path, outputPath);
    
    console.log('');
    console.log('=== Comparison Results ===');
    console.log(`Difference: ${result.diffPercentage.toFixed(2)}%`);
    console.log(`Different pixels: ${result.differentPixels.toLocaleString()} / ${result.totalPixels.toLocaleString()}`);
    console.log(`Comparison saved to: ${result.outputPath}`);
    console.log('');
    
    if (result.diffPercentage > 10) {
      console.log('⚠️  Significant differences detected!');
    } else if (result.diffPercentage > 5) {
      console.log('⚡ Moderate differences detected.');
    } else {
      console.log('✅ Images are very similar!');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
"