import fs from 'fs';

// Read both files
const jaContent = fs.readFileSync('src/i18n/translations/ja.ts', 'utf8');
const enContent = fs.readFileSync('src/i18n/translations/en.ts', 'utf8');

// Extract the object content (remove export const ja = and };)
const jaObj = jaContent.replace(/export const ja = /, '').replace(/};$/, '');
const enObj = enContent.replace(/export const en = /, '').replace(/};$/, '');

// Parse as JSON-like objects
try {
  const jaData = eval('(' + jaObj + ')');
  const enData = eval('(' + enObj + ')');
  
  console.log('JA keys:', Object.keys(jaData).length);
  console.log('EN keys:', Object.keys(enData).length);
  
  // Find missing keys in JA
  const missingInJa = [];
  function findMissing(obj1, obj2, path = '') {
    for (const key in obj2) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!obj1[key]) {
        missingInJa.push(currentPath);
      } else if (typeof obj2[key] === 'object' && obj2[key] !== null) {
        findMissing(obj1[key] || {}, obj2[key], currentPath);
      }
    }
  }
  
  findMissing(jaData, enData);
  console.log('Missing keys in JA:', missingInJa.length);
  console.log('First 20 missing keys:', missingInJa.slice(0, 20));
  
  // Find missing keys in EN
  const missingInEn = [];
  function findMissingEn(obj1, obj2, path = '') {
    for (const key in obj2) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!obj1[key]) {
        missingInEn.push(currentPath);
      } else if (typeof obj2[key] === 'object' && obj2[key] !== null) {
        findMissingEn(obj1[key] || {}, obj2[key], currentPath);
      }
    }
  }
  
  findMissingEn(enData, jaData);
  console.log('Missing keys in EN:', missingInEn.length);
  console.log('First 20 missing keys:', missingInEn.slice(0, 20));
  
} catch (e) {
  console.log('Error parsing files:', e.message);
}
