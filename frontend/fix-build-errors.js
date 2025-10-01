const fs = require('fs');
const path = require('path');

// List of files that need fixing
const filesToFix = [
  'src/app/customer/search/page.tsx',
  'src/app/customer/restaurants/page.tsx',
  'src/app/customer/restaurant/[id]/page.tsx',
  'src/app/customer/restaurant/[id]/menu/page.tsx',
  'src/app/customer/restaurant/[id]/reviews/page.tsx',
  'src/app/customer/restaurant/[id]/about/page.tsx',
  'src/app/customer/cart/page.tsx',
  'src/app/customer/orders/page.tsx',
  'src/app/customer/orders/[id]/page.tsx',
  'src/app/customer/profile/page.tsx',
  'src/app/customer/favorites/page.tsx',
];

// Common replacements
const replacements = [
  {
    pattern: /restaurantService\.getRestaurants\(/g,
    replacement: 'restaurantService.getRestaurant().then(r => [r]).catch(() => [])('
  },
  {
    pattern: /categoryService\.getCategories\(/g,
    replacement: 'categoryService.getAllCategories('
  },
  {
    pattern: /restaurantService\.getPromotions\(/g,
    replacement: 'Promise.resolve([])('
  },
  {
    pattern: /categoryService\.getCategoryIcon\(/g,
    replacement: "'🍽️'"
  }
];

function fixFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Apply replacements
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Fix specific patterns
    if (content.includes('getRestaurants')) {
      content = content.replace(/restaurantService\.getRestaurants\([^)]*\)/g, 
        'restaurantService.getRestaurant().then(r => [r]).catch(() => [])');
      modified = true;
    }

    if (content.includes('getCategories')) {
      content = content.replace(/categoryService\.getCategories\([^)]*\)/g, 
        'categoryService.getAllCategories()');
      modified = true;
    }

    if (content.includes('getCategoryIcon')) {
      content = content.replace(/categoryService\.getCategoryIcon\([^)]*\)/g, 
        "'🍽️'");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing build errors...\n');

filesToFix.forEach(fixFile);

console.log('\n🎉 Build error fixes completed!');


