const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('page.html', 'utf-8');
const dom = new JSDOM(html);
const document = dom.window.document;

// Mapping of ai-bot.cn category terms to our keys
const categoryMap = {
    "AI写作工具": "writing",
    "AI图像工具": "image",
    "AI视频工具": "video",
    "AI办公工具": "productivity",
    "AI智能体": "agent",
    "AI聊天助手": "chat",
    "AI编程工具": "coding",
    "AI开发平台": "devplatform",
    "AI设计工具": "design",
    "AI音频工具": "audio",
    "AI搜索引擎": "search",
    "AI学习网站": "learning",
    "AI训练模型": "model",
    "AI模型评测": "eval",
    "AI内容检测": "detect",
    "AI提示指令": "prompt"
};

const results = [];
let addedCount = 0;

// Ai-bot.cn structure: categories are usually identified by `h4.text-gray` headers
// OR by looking for elements with IDs matching the sidebar
// Let's try iterating through all headers that contain category terms
const headers = Array.from(document.querySelectorAll('h4.text-gray'));

for (const header of headers) {
    let categoryName = header.textContent.trim();
    let mappedKey = null;

    for (const [zhName, key] of Object.entries(categoryMap)) {
        if (categoryName.includes(zhName)) {
            mappedKey = key;
            break;
        }
    }

    if (mappedKey) {
        // Find the parent div of the header, then find the next element that contains the tool cards
        let container = header.parentElement;
        let nextEl = container.nextElementSibling;
        while (nextEl && !nextEl.classList.contains('row')) {
            nextEl = nextEl.nextElementSibling;
        }

        if (nextEl) {
            // Cards can have different classes
            const toolCards = document.evaluate(
                ".//*[contains(@class, 'url-card') or contains(@class, 'card site-card') or contains(@class, 'card no-c')]",
                nextEl, null, dom.window.XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
            );

            for (let i = 0; i < toolCards.snapshotLength; i++) {
                const card = toolCards.snapshotItem(i);

                // Get the anchor tag (could be the card itself or inside it)
                let linkEl = card.tagName === 'A' ? card : card.querySelector('a');
                if (!linkEl) continue;

                let href = linkEl.getAttribute('data-url') || linkEl.getAttribute('href');
                if (href && href.startsWith('http')) {
                    if (href.includes('go/?url=')) {
                        try {
                            const urlObj = new URL(href);
                            href = urlObj.searchParams.get('url') || href;
                        } catch (e) { }
                    }
                }

                const titleEl = card.querySelector('strong');
                const name = titleEl ? titleEl.textContent.trim() : "";

                const descEl = card.querySelector('.text-muted.text-xs') || card.querySelector('.overflowClip_1');
                const summary = descEl ? descEl.textContent.trim() : "";

                if (name && !results.some(t => t.name === name)) {
                    results.push({
                        name,
                        summary,
                        href: href || "",
                        category: mappedKey,
                        tags: [mappedKey]
                    });
                    addedCount++;
                }
            }
        }
    }
}

console.log(`Extracted ${addedCount} tools.`);

let tsContent = `export const aiTools = [\n`;
results.forEach(tool => {
    tsContent += `  { name: ${JSON.stringify(tool.name)}, summary: ${JSON.stringify(tool.summary)}, href: ${JSON.stringify(tool.href)}, category: "${tool.category}", tags: ${JSON.stringify(tool.tags)} },\n`;
});
tsContent += `];\n`;

fs.writeFileSync('output.ts', tsContent);
console.log("Saved to output.ts");
