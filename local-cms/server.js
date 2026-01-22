import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import matter from 'gray-matter';
import { promisify } from 'util';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const POSTS_DIR = path.join(__dirname, '../src/posts');
const DATA_JS_DIR = path.join(__dirname, '../src/posts/dataJs');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const ASSETS_DIR = path.join(__dirname, '../src/assets');

// 确保目录存在
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function isSafePathInside(baseDir, filePath) {
    const normalized = path.normalize(filePath);
    const normalizedBase = path.normalize(baseDir + path.sep);
    return normalized.startsWith(normalizedBase);
}

function getPostFilePathBySlug(slug) {
    const rawSlug = String(slug || '');
    if (!rawSlug) return null;
    if (rawSlug.includes('\0')) return null;
    const fileName = `${rawSlug}.md`;
    const candidate = path.join(POSTS_DIR, fileName);
    if (!isSafePathInside(POSTS_DIR, candidate)) return null;
    return candidate;
}

function estimateWordCount(content) {
    const text = String(content || '').trim();
    if (!text) return 0;
    return text.replace(/\s+/g, '').length;
}

function estimateReadingTimeMinutes(wordCount) {
    const wc = Number(wordCount) || 0;
    if (wc <= 0) return 1;
    return Math.max(1, Math.ceil(wc / 400));
}

// 辅助函数：解析 JS 数据文件
function parseJsDataFile(content) {
    // 1. 尝试提取数组内容 [ ... ]
    const match = content.match(/=\s*(\[[\s\S]*\])/);
    if (!match) return [];
    
    let arrayStr = match[1];
    
    // 2. 处理 new URL(...)
    // 将 new URL('path', import.meta.url).href 替换为 "path"
    // 使得它可以被 JSON.parse (经过一些处理) 或者 eval
    arrayStr = arrayStr.replace(/new\s+URL\s*\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)\.href/g, (match, p1) => {
        const normalized = String(p1);
        const assetRelMatch = normalized.match(/^(\.\.\/)+assets\/(.+)$/);
        if (assetRelMatch) {
            const rel = assetRelMatch[2];
            return `"/assets/${rel}"`;
        }
        return `"${normalized}"`;
    });

    // 3. 处理其他可能的非 JSON 语法 (如单引号转双引号，移除尾随逗号等)
    // 最简单的方法是使用 Function/eval，因为它是受信任的本地代码
    try {
        const data = new Function('return ' + arrayStr)();
        return data;
    } catch (e) {
        console.error("Parse error:", e);
        return [];
    }
}

// 辅助函数：生成 JS 数据文件内容
function generateJsDataFile(varName, data) {
    // 1. 序列化数据
    let jsonStr = JSON.stringify(data, null, 4);

    // 2. 恢复 new URL(...)
    // - 支持 ../../assets/... 或 ../assets/... 这种相对路径
    // - 兼容管理后台里展示用的 /assets/... 绝对路径（写回 dataJs 时转为 ../../assets/...）
    jsonStr = jsonStr.replace(/"((?:\.\.\/)+assets\/[^"]+)"/g, (match, p1) => {
        return `new URL('${p1}', import.meta.url).href`;
    });

    jsonStr = jsonStr.replace(/"(\/assets\/[^"]+)"/g, (match, p1) => {
        const rel = String(p1).replace(/^\/assets\//, '');
        return `new URL('../../assets/${rel}', import.meta.url).href`;
    });

    return `export const ${varName} = ${jsonStr};`;
}

function getPostCategories() {
    if (!fs.existsSync(POSTS_DIR)) return [];

    const categories = new Set();
    const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.toLowerCase().endsWith('.md')) continue;
        if (entry.name.toLowerCase() === 'all.md') continue;

        try {
            const filePath = path.join(POSTS_DIR, entry.name);
            const raw = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(raw);
            const category = typeof data?.category === 'string' ? data.category.trim() : '';
            if (category) categories.add(category);
        } catch {
        }
    }

    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function listPosts() {
    if (!fs.existsSync(POSTS_DIR)) return [];

    const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
    const posts = [];

    for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.toLowerCase().endsWith('.md')) continue;
        if (entry.name.toLowerCase() === 'all.md') continue;

        const slug = entry.name.replace(/\.md$/i, '');
        const filePath = path.join(POSTS_DIR, entry.name);
        if (!isSafePathInside(POSTS_DIR, filePath)) continue;

        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(raw);
            posts.push({
                slug,
                title: String(data?.title ?? slug),
                description: String(data?.description ?? ''),
                date: String(data?.date ?? ''),
                updated: String(data?.updated ?? ''),
                category: String(data?.category ?? ''),
                tags: Array.isArray(data?.tags) ? data.tags.map((t) => String(t)) : [],
                cover: String(data?.cover ?? '')
            });
        } catch {
            posts.push({
                slug,
                title: slug,
                description: '',
                date: '',
                updated: '',
                category: '',
                tags: [],
                cover: ''
            });
        }
    }

    const orderFilePath = path.join(DATA_JS_DIR, 'postOrder.js');
    let orderedSlugs = [];
    try {
        if (fs.existsSync(orderFilePath)) {
            const orderContent = fs.readFileSync(orderFilePath, 'utf-8');
            const parsed = parseJsDataFile(orderContent);
            if (Array.isArray(parsed)) {
                orderedSlugs = parsed.map((s) => String(s || '').trim()).filter(Boolean);
            }
        }
    } catch {
        orderedSlugs = [];
    }

    const orderIndex = new Map();
    orderedSlugs.forEach((slug, idx) => {
        if (!orderIndex.has(slug)) orderIndex.set(slug, idx);
    });

    posts.sort((a, b) => {
        const ai = orderIndex.has(a.slug) ? orderIndex.get(a.slug) : null;
        const bi = orderIndex.has(b.slug) ? orderIndex.get(b.slug) : null;
        if (ai != null && bi != null) return ai - bi;
        if (ai != null) return -1;
        if (bi != null) return 1;
        return String(b.date).localeCompare(String(a.date), 'zh-CN');
    });
    return posts;
}

function getContentTypeByExt(ext) {
    switch (ext.toLowerCase()) {
        case '.html': return 'text/html; charset=utf-8';
        case '.css': return 'text/css; charset=utf-8';
        case '.js': return 'application/javascript; charset=utf-8';
        case '.json': return 'application/json; charset=utf-8';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        case '.svg': return 'image/svg+xml';
        case '.ico': return 'image/x-icon';
        case '.mp3': return 'audio/mpeg';
        case '.flac': return 'audio/flac';
        default: return 'application/octet-stream';
    }
}

function serveStaticFile(res, baseDir, urlPath, prefix) {
    try {
        const rawRel = decodeURIComponent(urlPath.slice(prefix.length));
        const relPath = rawRel.replace(/^\/+/, '');
        const candidate = path.join(baseDir, relPath);
        const normalized = path.normalize(candidate);
        const normalizedBase = path.normalize(baseDir + path.sep);
        if (!normalized.startsWith(normalizedBase)) {
            res.writeHead(403);
            res.end('Forbidden');
            return true;
        }
        if (!fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) {
            res.writeHead(404);
            res.end('Not Found');
            return true;
        }

        const contentType = getContentTypeByExt(path.extname(normalized));
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(normalized).pipe(res);
        return true;
    } catch {
        res.writeHead(500);
        res.end('Server Error');
        return true;
    }
}

// 映射文件名到变量名
const FILE_VAR_MAP = {
    'friendList.js': 'friendsList',
    'photos.js': 'photos',
    'quotes.js': 'quotes',
    'thoughts.js': 'thoughts',
    'aboutData.js': 'qaList',
    'postOrder.js': 'postOrder'
};

const server = http.createServer((req, res) => {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Name');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // 1. 服务静态页面 (HTML)
    if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // 2. 通用数据读取 API
    // GET /api/data?file=friendList.js
    if (parsedUrl.pathname === '/api/data' && req.method === 'GET') {
        const fileName = parsedUrl.query.file;
        if (!FILE_VAR_MAP[fileName]) {
            res.writeHead(400);
            res.end('Invalid file');
            return;
        }

        const filePath = path.join(DATA_JS_DIR, fileName);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = parseJsDataFile(content);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(404);
            res.end('File not found');
        }
        return;
    }

    // 3. 通用数据保存 API
    // POST /api/data?file=friendList.js
    if (parsedUrl.pathname === '/api/data' && req.method === 'POST') {
        const fileName = parsedUrl.query.file;
        const varName = FILE_VAR_MAP[fileName];
        
        if (!varName) {
            res.writeHead(400);
            res.end('Invalid file');
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const fileContent = generateJsDataFile(varName, data);
                const filePath = path.join(DATA_JS_DIR, fileName);

                fs.writeFile(filePath, fileContent, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(JSON.stringify({ success: false, message: err.message }));
                    } else {
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        });
        return;
    }

    // 4. 保存文章 API (保持不变)
    if (parsedUrl.pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                // 构造 Markdown 内容
                const fileContent = `---
title: ${data.title}
description: ${data.description || ''}
date: ${data.date}
category: ${data.category || '未分类'}
tags:
${data.tags.map(tag => `  - ${tag}`).join('\n')}
cover: ${data.cover || ''}
updated: ${data.date}
readingTime: ${data.readingTime || 5}
wordCount: ${data.wordCount || 0}
---

${data.content}`;

                // 生成文件名 (处理特殊字符)
                const safeTitle = data.title.replace(/[\\/:*?"<>|]/g, '-');
                const filePath = path.join(POSTS_DIR, `${safeTitle}.md`);

                fs.writeFile(filePath, fileContent, (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: err.message }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, path: filePath }));
                    }
                });
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
            }
        });
        return;
    }

    // 4.2 文章列表
    if (parsedUrl.pathname === '/api/posts' && req.method === 'GET') {
        try {
            const posts = listPosts();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(posts));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: e.message }));
        }
        return;
    }

    // 4.3 读取/更新/删除单篇文章
    if (parsedUrl.pathname === '/api/post') {
        const slug = parsedUrl.query.slug;
        const filePath = getPostFilePathBySlug(slug);

        if (req.method === 'GET') {
            if (!filePath) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Invalid slug' }));
                return;
            }
            if (!fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, message: 'Not Found' }));
                return;
            }
            try {
                const raw = fs.readFileSync(filePath, 'utf-8');
                const parsed = matter(raw);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, slug: String(slug), data: parsed.data || {}, content: parsed.content || '' }));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        } else if (req.method === 'PUT') {
            if (!filePath) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Invalid slug' }));
                return;
            }
            if (!fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, message: 'Not Found' }));
                return;
            }
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const payload = JSON.parse(body || '{}');
                    const content = String(payload.content ?? '');
                    const incoming = payload.data && typeof payload.data === 'object' ? payload.data : {};

                    const wordCount = Number(incoming.wordCount) || estimateWordCount(content);
                    const readingTime = Number(incoming.readingTime) || estimateReadingTimeMinutes(wordCount);
                    const now = new Date().toISOString().split('T')[0];

                    const merged = {
                        ...incoming,
                        title: String(incoming.title ?? '').trim(),
                        description: String(incoming.description ?? ''),
                        date: String(incoming.date ?? ''),
                        category: String(incoming.category ?? ''),
                        tags: Array.isArray(incoming.tags) ? incoming.tags : [],
                        cover: String(incoming.cover ?? ''),
                        updated: now,
                        wordCount,
                        readingTime
                    };

                    const markdown = matter.stringify(content, merged);

                    fs.writeFile(filePath, markdown, (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: err.message }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                } catch (e) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
                }
            });
        } else if (req.method === 'DELETE') {
            if (!filePath) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Invalid slug' }));
                return;
            }
            if (!fs.existsSync(filePath)) {
                res.writeHead(200); // 已经删除了，视为成功
                res.end(JSON.stringify({ success: true }));
                return;
            }
            try {
                fs.unlinkSync(filePath);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        }
        return;
    }

    // 4.1 获取现有分类
    if (parsedUrl.pathname === '/api/categories' && req.method === 'GET') {
        try {
            const categories = getPostCategories();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(categories));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: e.message }));
        }
        return;
    }

    // 4.4 Git 发布 API
    if (parsedUrl.pathname === '/api/git/publish' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { message } = JSON.parse(body || '{}');
                if (!message) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ success: false, message: 'Commit message is required' }));
                    return;
                }

                console.log(`\n🚀 开始执行 Git 发布...`);
                
                // 1. git add .
                console.log('-> git add .');
                await execPromise('git add .');

                // 2. git commit -m "..."
                console.log(`-> git commit -m "${message}"`);
                try {
                    await execPromise(`git commit -m "${message}"`);
                } catch (err) {
                    // 如果没有变化可以提交，git commit 会报错，这里简单处理下
                    if (err.stdout && err.stdout.includes('nothing to commit')) {
                        console.log('-> nothing to commit, continuing...');
                    } else {
                        throw err;
                    }
                }

                // 3. git push
                console.log('-> git push');
                await execPromise('git push');

                console.log('✅ 发布成功！');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Published successfully' }));
            } catch (e) {
                console.error('❌ 发布失败:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        });
        return;
    }

    // 5. 上传图片 API
    if (parsedUrl.pathname === '/api/upload' && req.method === 'POST') {
        const fileName = req.headers['x-file-name'] || `image-${Date.now()}.png`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const fileStream = fs.createWriteStream(filePath);

        req.pipe(fileStream);

        fileStream.on('finish', () => {
            const publicPath = `/uploads/${fileName}`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, url: publicPath }));
        });

        fileStream.on('error', (err) => {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: err.message }));
        });
        return;
    }

    if (parsedUrl.pathname?.startsWith('/uploads/')) {
        if (serveStaticFile(res, UPLOADS_DIR, parsedUrl.pathname, '/uploads/')) return;
    }

    if (parsedUrl.pathname?.startsWith('/assets/')) {
        if (serveStaticFile(res, ASSETS_DIR, parsedUrl.pathname, '/assets/')) return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`\n✅ 博客管理后台已启动！`);
    console.log(`👉 请在浏览器访问: http://localhost:${PORT}\n`);
});
