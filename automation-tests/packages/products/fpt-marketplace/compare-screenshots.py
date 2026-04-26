"import os
import sys
from PIL import Image, ImageDraw, ImageChops
import numpy as np

def compare_images(img1_path, img2_path, output_path=None):
    """
    Compare two images and highlight differences.
    
    Args:
        img1_path: Path to first image (Grafana)
        img2_path: Path to second image (Marketplace)
        output_path: Path to save diff image
    
    Returns:
        dict: Comparison results
    """
    # Load images
    img1 = Image.open(img1_path).convert('RGB')
    img2 = Image.open(img2_path).convert('RGB')
    
    # Resize to same size (use smaller dimensions)
    width = min(img1.width, img2.width)
    height = min(img1.height, img2.height)
    img1 = img1.resize((width, height))
    img2 = img2.resize((width, height))
    
    # Calculate difference
    diff = ImageChops.difference(img1, img2)
    
    # Convert to grayscale for easier processing
    diff_gray = diff.convert('L')
    
    # Count different pixels
    diff_array = np.array(diff_gray)
    threshold = 30  # Threshold for considering a pixel different
    different_pixels = np.sum(diff_array > threshold)
    total_pixels = width * height
    diff_percentage = (different_pixels / total_pixels) * 100
    
    # Create diff image with highlighted differences
    diff_highlighted = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(diff_highlighted)
    
    # Draw different pixels in red
    for y in range(height):
        for x in range(width):
            if diff_array[y, x] > threshold:
                draw.point((x, y), fill='red')
    
    # Create side-by-side comparison
    comparison = Image.new('RGB', (width * 3 + 20, height + 100), 'white')
    draw_comp = ImageDraw.Draw(comparison)
    
    # Paste images
    comparison.paste(img1, (0, 50))
    comparison.paste(img2, (width + 10, 50))
    comparison.paste(diff_highlighted, (width * 2 + 20, 50))
    
    # Add labels
    draw_comp.text((10, 10), 'Grafana', fill='black')
    draw_comp.text((width + 20, 10), 'Marketplace', fill='black')
    draw_comp.text((width * 2 + 30, 10), 'Diff (Red=Different)', fill='black')
    draw_comp.text((10, 30), f'Difference: {diff_percentage:.2f}%', fill='red' if diff_percentage > 5 else 'green')
    
    # Save comparison
    if output_path is None:
        output_path = 'comparison_result.png'
    comparison.save(output_path)
    
    return {
        'diff_percentage': diff_percentage,
        'different_pixels': int(different_pixels),
        'total_pixels': total_pixels,
        'output_path': output_path
    }

def main():
    print('=== Screenshot Comparison Tool ===')
    print()
    
    # Get image paths
    img1_path = input('Enter path to Grafana screenshot: ').strip()
    img2_path = input('Enter path to Marketplace screenshot: ').strip()
    output_path = input('Enter output path (default: comparison_result.png): ').strip() or 'comparison_result.png'
    
    # Validate inputs
    if not os.path.exists(img1_path):
        print(f'Error: Grafana screenshot not found: {img1_path}')
        sys.exit(1)
    
    if not os.path.exists(img2_path):
        print(f'Error: Marketplace screenshot not found: {img2_path}')
        sys.exit(1)
    
    print()
    print('Comparing images...')
    
    # Compare images
    result = compare_images(img1_path, img2_path, output_path)
    
    print()
    print('=== Comparison Results ===')
    print(f'Difference: {result["diff_percentage"]:.2f}%')
    print(f'Different pixels: {result["different_pixels"]:,} / {result["total_pixels"]:,}')
    print(f'Comparison saved to: {result["output_path"]}')
    print()
    
    if result['diff_percentage'] > 10:
        print('⚠️  Significant differences detected!')
    elif result['diff_percentage'] > 5:
        print('⚡ Moderate differences detected.')
    else:
        print('✅ Images are very similar!')

if __name__ == '__main__':
    main()
"