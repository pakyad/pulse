const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('D:/FYP/Pulse/app').concat(walk('D:/FYP/Pulse/components')).concat(walk('D:/FYP/Pulse/lib'));

files.forEach(file => {
    if (file.includes('auth-utils.ts')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    content = content.replace(/DOMAIN_ICONS/g, 'CATEGORY_ICONS');
    content = content.replace(/DOMAIN_LABELS/g, 'CATEGORY_LABELS');
    content = content.replace(/MARKETPLACE_DOMAINS/g, 'MARKETPLACE_CATEGORIES');
    content = content.replace(/DomainID/g, 'CategoryID');
    content = content.replace(/DomainConfig/g, 'CategoryConfig');
    content = content.replace(/selectedDomain/g, 'selectedCategory');
    content = content.replace(/setSelectedDomain/g, 'setSelectedCategory');
    content = content.replace(/domainId/g, 'categoryId');
    content = content.replace(/DomainSelector/g, 'CategorySelector');
    content = content.replace(/DomainIcon/g, 'CategoryIcon');
    
    content = content.replace(/Domain pill/g, 'Category pill');
    content = content.replace(/DOMAIN REGISTRY/g, 'CATEGORY REGISTRY');
    content = content.replace(/SMART DOMAIN/g, 'SMART CATEGORY');
    content = content.replace(/Domain-specific/g, 'Category-specific');
    
    content = content.replace(/\bdomain\b/g, 'category');
    content = content.replace(/\bdomains\b/g, 'categories');
    content = content.replace(/\bDomain\b/g, 'Category');
    content = content.replace(/\bDOMAINS\b/g, 'CATEGORIES');

    // fix imports to keep them pointing to the old filenames, to avoid breaking file resolution
    content = content.replace(/@\/lib\/marketplace\/categories/g, '@/lib/marketplace/domains');
    content = content.replace(/@\/components\/marketplace\/CategorySelector/g, '@/components/marketplace/DomainSelector');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
