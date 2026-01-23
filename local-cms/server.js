import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import matter from 'gray-matter';
import { promisify } from 'util';
import sharp from 'sharp';
import archiver from 'archiver';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const POSTS_DIR = path.join(__dirname, '../src/posts');
const DATA_JS_DIR = path.join(__dirname, '../src/posts/dataJs');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const ASSETS_DIR = path.join(__dirname, '../src/assets');

// 媒体使用分析辅助函数
function getMediaUsageMap() {
    const usageMap = {}; // { url: [{ type: 'post'|'data', name: 'xxx', path: 'xxx' }] }
    
    // 1. 扫描 Markdown 文章
    if (fs.existsSync(POSTS_DIR)) {
        const posts = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
        posts.forEach(file => {
            const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
            // 匹配 Markdown 图片语法: ![alt](url)
            const mdImageRegex = /!\[.*?\]\((.*?)\)/g;
            // 匹配 Frontmatter 中的 cover 字段
            const fmCoverRegex = /cover:\s*['"]?(.*?)['"]?\s*$/m;
            
            let match;
            while ((match = mdImageRegex.exec(content)) !== null) {
                const url = match[1];
                if (!usageMap[url]) usageMap[url] = [];
                usageMap[url].push({ type: 'post', name: file.replace('.md', ''), file });
            }
            
            const fmMatch = fmCoverRegex.exec(content);
            if (fmMatch && fmMatch[1]) {
                const url = fmMatch[1];
                if (!usageMap[url]) usageMap[url] = [];
                usageMap[url].push({ type: 'post', name: file.replace('.md', ''), file });
            }
        });
    }

    // 2. 扫描 JS 数据文件 (相册、友链等)
    if (fs.existsSync(DATA_JS_DIR)) {
        const dataFiles = fs.readdirSync(DATA_JS_DIR).filter(f => f.endsWith('.js'));
        dataFiles.forEach(file => {
            const content = fs.readFileSync(path.join(DATA_JS_DIR, file), 'utf-8');
            // 匹配引号中的 URL
            const urlRegex = /['"](\/(?:uploads|assets)\/.*?)['"]/g;
            // 匹配 new URL('...', import.meta.url)
            const newUrlRegex = /new\s+URL\s*\(\s*['"](.*?)['"]\s*,\s*import\.meta\.url\s*\)/g;

            let match;
            while ((match = urlRegex.exec(content)) !== null) {
                const url = match[1];
                if (!usageMap[url]) usageMap[url] = [];
                usageMap[url].push({ type: 'data', name: file, file });
            }
            while ((match = newUrlRegex.exec(content)) !== null) {
                let url = match[1];
                // 转换相对路径为显示路径
                if (url.includes('assets/')) {
                    const assetName = url.split('assets/').pop();
                    url = `/assets/${assetName}`;
                }
                if (!usageMap[url]) usageMap[url] = [];
                usageMap[url].push({ type: 'data', name: file, file });
            }
        });
    }

    return usageMap;
}

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

// 辅助函数：复制目录
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 辅助函数：统计文件数量
function countFiles(dir) {
    let count = 0;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += countFiles(entryPath);
        } else {
            count++;
        }
    }
    
    return count;
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
        
                    const slug = entry.name.replace(/\.md$/i, '');
                    const filePath = path.join(POSTS_DIR, entry.name);
                    if (!isSafePathInside(POSTS_DIR, filePath)) continue;
        
                    try {
                        const raw = fs.readFileSync(filePath, 'utf-8');
                        const { data, content } = matter(raw);
                        posts.push({
                            slug,
                            title: String(data?.title ?? slug),
                            description: String(data?.description ?? ''),
                            date: String(data?.date ?? ''),
                            status: String(data?.status ?? 'published'),
                            updated: String(data?.updated ?? ''),
                            category: String(data?.category ?? ''),
                            tags: Array.isArray(data?.tags) ? data.tags.map((t) => String(t)) : [],
                            cover: String(data?.cover ?? ''),
                            content: content // 增加 content 字段以支持全文搜索
                        });
                    } catch {
                        posts.push({
                            slug,
                            title: slug,
                            description: '',
                            date: '',
                            status: 'published',
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

const server = http.createServer(async (req, res) => {
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
status: ${data.status || 'published'}
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
                    // 排除 content 字段，避免污染 Frontmatter
                    const { content: _, ...cleanIncoming } = incoming;

                    const wordCount = Number(incoming.wordCount) || estimateWordCount(content);
                    const readingTime = Number(incoming.readingTime) || estimateReadingTimeMinutes(wordCount);
                    const now = new Date().toISOString().split('T')[0];

                    const merged = {
                        ...cleanIncoming,
                        title: String(incoming.title ?? '').trim(),
                        description: String(incoming.description ?? ''),
                        date: String(incoming.date ?? ''),
                        status: String(incoming.status || 'published'),
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

    // 4.5 获取 Git 历史记录
    if (parsedUrl.pathname === '/api/git/history' && req.method === 'GET') {
        try {
            const { stdout } = await execPromise('git log -n 20 --pretty=format:"%H|%an|%ar|%s"');
            const history = stdout.split('\n').filter(Boolean).map(line => {
                const [hash, author, date, message] = line.split('|');
                return { hash, author, date, message };
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, history }));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: e.message }));
        }
        return;
    }

    // 4.6 Git 回滚 API
    if (parsedUrl.pathname === '/api/git/rollback' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { hash } = JSON.parse(body);
                if (!hash) throw new Error('Commit hash is required');
                
                console.log(`\n🔙 正在执行回滚到: ${hash}...`);
                
                // 1. 在回滚前先创建一个临时提交，防止丢失当前未提交的修改
                try {
                    await execPromise('git add .');
                    const status = await execPromise('git status --porcelain');
                    if (status.stdout.trim()) {
                        await execPromise(`git commit -m "Auto-snapshot before rollback to ${hash.substring(0, 7)}"`);
                        console.log('-> 已自动保存当前更改到新提交');
                    }
                } catch (err) {
                    console.log('-> 跳过自动保存 (可能没有更改或已在最新提交)');
                }

                // 2. 强制重置到指定提交
                await execPromise(`git reset --hard ${hash}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Rollback successful' }));
            } catch (e) {
                console.error('❌ 回滚失败:', e);
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        });
        return;
    }

    // 4.7 系统备份 API (生成 ZIP)
    if (parsedUrl.pathname === '/api/system/backup' && req.method === 'GET') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `blog-backup-${timestamp}.zip`;
        
        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${fileName}"`
        });

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => { throw err; });
        archive.pipe(res);

        // 备份核心内容
        if (fs.existsSync(POSTS_DIR)) archive.directory(POSTS_DIR, 'content/posts');
        if (fs.existsSync(DATA_JS_DIR)) archive.directory(DATA_JS_DIR, 'content/data');
        if (fs.existsSync(UPLOADS_DIR)) archive.directory(UPLOADS_DIR, 'public/uploads');
        if (fs.existsSync(ASSETS_DIR)) archive.directory(ASSETS_DIR, 'src/assets');
        
        // 备份配置文件
        archive.file(path.join(__dirname, '../package.json'), { name: 'package.json' });
        archive.file(path.join(__dirname, '../vite.config.js'), { name: 'vite.config.js' });
        archive.file(path.join(__dirname, '../index.html'), { name: 'index.html' });

        archive.finalize();
        return;
    }

    // 4.9 系统恢复 API (上传 ZIP)
    if (parsedUrl.pathname === '/api/system/restore' && req.method === 'POST') {
        const tempDir = path.join(__dirname, `../tmp/restore-${Date.now()}`);
        const uploadPath = path.join(tempDir, 'backup.zip');
        
        try {
            // 确保临时目录存在
            fs.mkdirSync(tempDir, { recursive: true });
            
            // 保存上传的文件
            const writeStream = fs.createWriteStream(uploadPath);
            req.pipe(writeStream);
            
            writeStream.on('finish', async () => {
                try {
                    // 解压 ZIP 文件
                    const extractDir = path.join(tempDir, 'extract');
                    fs.mkdirSync(extractDir, { recursive: true });
                    
                    const archive = archiver('zip', { zlib: { level: 9 } });
                    // 使用 adm-zip 解压
                    const AdmZip = (await import('adm-zip')).default;
                    const zip = new AdmZip(uploadPath);
                    zip.extractAllTo(extractDir, true);
                    
                    // 恢复核心内容
                    const restoreStats = {
                        posts: 0,
                        data: 0,
                        uploads: 0,
                        assets: 0,
                        config: 0
                    };
                    
                    // 1. 恢复文章内容
                    const extractedPostsDir = path.join(extractDir, 'content/posts');
                    if (fs.existsSync(extractedPostsDir)) {
                        // 清空现有文章目录
                        fs.rmSync(POSTS_DIR, { recursive: true, force: true });
                        fs.mkdirSync(POSTS_DIR, { recursive: true });
                        // 复制恢复的文章
                        copyDir(extractedPostsDir, POSTS_DIR);
                        restoreStats.posts = countFiles(POSTS_DIR);
                    }
                    
                    // 2. 恢复数据文件
                    const extractedDataDir = path.join(extractDir, 'content/data');
                    if (fs.existsSync(extractedDataDir)) {
                        // 清空现有数据目录
                        fs.rmSync(DATA_JS_DIR, { recursive: true, force: true });
                        fs.mkdirSync(DATA_JS_DIR, { recursive: true });
                        // 复制恢复的数据文件
                        copyDir(extractedDataDir, DATA_JS_DIR);
                        restoreStats.data = countFiles(DATA_JS_DIR);
                    }
                    
                    // 3. 恢复上传文件
                    const extractedUploadsDir = path.join(extractDir, 'public/uploads');
                    if (fs.existsSync(extractedUploadsDir)) {
                        // 清空现有上传目录
                        fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
                        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
                        // 复制恢复的上传文件
                        copyDir(extractedUploadsDir, UPLOADS_DIR);
                        restoreStats.uploads = countFiles(UPLOADS_DIR);
                    }
                    
                    // 4. 恢复静态资源
                    const extractedAssetsDir = path.join(extractDir, 'src/assets');
                    if (fs.existsSync(extractedAssetsDir)) {
                        // 清空现有资源目录
                        fs.rmSync(ASSETS_DIR, { recursive: true, force: true });
                        fs.mkdirSync(ASSETS_DIR, { recursive: true });
                        // 复制恢复的资源文件
                        copyDir(extractedAssetsDir, ASSETS_DIR);
                        restoreStats.assets = countFiles(ASSETS_DIR);
                    }
                    
                    // 5. 恢复配置文件
                    const configFiles = ['package.json', 'vite.config.js', 'index.html'];
                    configFiles.forEach(file => {
                        const extractedConfig = path.join(extractDir, file);
                        if (fs.existsSync(extractedConfig)) {
                            fs.copyFileSync(extractedConfig, path.join(__dirname, `../${file}`));
                            restoreStats.config++;
                        }
                    });
                    
                    // 清理临时文件
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    
                    // 返回恢复结果
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: '恢复成功',
                        stats: restoreStats
                    }));
                } catch (err) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                    throw err;
                }
            });
            
            writeStream.on('error', (err) => {
                fs.rmSync(tempDir, { recursive: true, force: true });
                throw err;
            });
        } catch (err) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: err.message }));
        }
        
        return;
    }

    // 4.8 分类/标签重命名 API
    if (parsedUrl.pathname === '/api/taxonomy/rename' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { type, oldName, newName } = JSON.parse(body);
                if (!oldName || !newName) throw new Error('Invalid params');

                const posts = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
                let updatedCount = 0;

                posts.forEach(file => {
                    const filePath = path.join(POSTS_DIR, file);
                    const raw = fs.readFileSync(filePath, 'utf-8');
                    const { data, content } = matter(raw);
                    let changed = false;

                    if (type === 'category' && data.category === oldName) {
                        data.category = newName;
                        changed = true;
                    } else if (type === 'tag' && Array.isArray(data.tags)) {
                        const idx = data.tags.indexOf(oldName);
                        if (idx !== -1) {
                            data.tags[idx] = newName;
                            changed = true;
                        }
                    }

                    if (changed) {
                        fs.writeFileSync(filePath, matter.stringify(content, data));
                        updatedCount++;
                    }
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, updatedCount }));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        });
        return;
    }

    // 4.6 分类/标签删除 API
    if (parsedUrl.pathname === '/api/taxonomy/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { type, name } = JSON.parse(body);
                if (!name) throw new Error('Invalid params');

                const posts = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
                let updatedCount = 0;

                posts.forEach(file => {
                    const filePath = path.join(POSTS_DIR, file);
                    const raw = fs.readFileSync(filePath, 'utf-8');
                    const { data, content } = matter(raw);
                    let changed = false;

                    if (type === 'category' && data.category === name) {
                        data.category = '未分类';
                        changed = true;
                    } else if (type === 'tag' && Array.isArray(data.tags)) {
                        const idx = data.tags.indexOf(name);
                        if (idx !== -1) {
                            data.tags.splice(idx, 1);
                            changed = true;
                        }
                    }

                    if (changed) {
                        fs.writeFileSync(filePath, matter.stringify(content, data));
                        updatedCount++;
                    }
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, updatedCount }));
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: e.message }));
            }
        });
        return;
    }

    // 5. 上传图片 API (带自动化压缩与 WebP 转换)
    if (parsedUrl.pathname === '/api/upload' && req.method === 'POST') {
        const rawFileName = req.headers['x-file-name'];
        let fileName = `image-${Date.now()}.png`;
        
        if (rawFileName) {
            try {
                fileName = decodeURIComponent(rawFileName).replace(/[\\/:*?"<>|]/g, '-');
            } catch (e) {
                fileName = rawFileName.replace(/[\\/:*?"<>|]/g, '-');
            }
        }

        // 强制转换为 webp 以优化性能
        const baseName = path.parse(fileName).name;
        const webpName = `${baseName}-${Date.now()}.webp`;
        const filePath = path.join(UPLOADS_DIR, webpName);
        
        if (!isSafePathInside(UPLOADS_DIR, filePath)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Forbidden' }));
            return;
        }

        // 使用 sharp 进行流式处理
        const transformer = sharp()
            .webp({ quality: 80 }) // 转换为 webp，质量设为 80
            .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }); // 限制最大尺寸

        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const buffer = Buffer.concat(chunks);
                await transformer.putObject ? null : null; // dummy
                
                await sharp(buffer)
                    .webp({ quality: 80 })
                    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
                    .toFile(filePath);

                const publicPath = `/uploads/${webpName}`;
                console.log(`文件自动化处理完成: ${publicPath}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, url: publicPath }));
            } catch (err) {
                console.error('Sharp processing error:', err);
                // 如果 sharp 失败（比如不是图片），尝试直接保存
                try {
                    fs.writeFileSync(filePath, Buffer.concat(chunks));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, url: `/uploads/${webpName}` }));
                } catch (writeErr) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ success: false, message: writeErr.message }));
                }
            }
        });
        return;
    }

    // 5.1 获取媒体库文件列表
    if (parsedUrl.pathname === '/api/media' && req.method === 'GET') {
        try {
            const usageMap = getMediaUsageMap();
            
            const allFiles = [];

            // 1. 读取 uploads 目录
            if (fs.existsSync(UPLOADS_DIR)) {
                const uploadFiles = fs.readdirSync(UPLOADS_DIR)
                    .filter(file => !file.startsWith('.'))
                    .map(file => {
                        const url = `/uploads/${file}`;
                        const stats = fs.statSync(path.join(UPLOADS_DIR, file));
                        return {
                            name: file,
                            url: url,
                            size: stats.size,
                            mtime: stats.mtime,
                            usage: usageMap[url] || [],
                            source: 'uploads'
                        };
                    });
                allFiles.push(...uploadFiles);
            }

            // 2. 读取 assets 目录 (递归)
            if (fs.existsSync(ASSETS_DIR)) {
                const scanAssets = (dir, relPath = '') => {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const res = path.resolve(dir, entry.name);
                        const rel = path.join(relPath, entry.name).replace(/\\/g, '/');
                        if (entry.isDirectory()) {
                            scanAssets(res, rel);
                        } else if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(entry.name)) {
                            const url = `/assets/${rel}`;
                            const stats = fs.statSync(res);
                            allFiles.push({
                                name: entry.name,
                                url: url,
                                size: stats.size,
                                mtime: stats.mtime,
                                usage: usageMap[url] || [],
                                source: 'assets'
                            });
                        }
                    }
                };
                scanAssets(ASSETS_DIR);
            }

            allFiles.sort((a, b) => b.mtime - a.mtime);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(allFiles));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: e.message }));
        }
        return;
    }

    // 5.2 删除媒体库文件
    if (parsedUrl.pathname === '/api/media' && req.method === 'DELETE') {
        const fileName = parsedUrl.query.name;
        const batch = parsedUrl.query.batch === 'true';

        if (batch) {
            // 批量清理未使用图片
            try {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    const { names } = JSON.parse(body);
                    let deletedCount = 0;
                    names.forEach(name => {
                        const filePath = path.join(UPLOADS_DIR, name);
                        if (isSafePathInside(UPLOADS_DIR, filePath) && fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            deletedCount++;
                        }
                    });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, deletedCount }));
                });
                return;
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, message: e.message }));
                return;
            }
        }

        if (!fileName) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'File name is required' }));
            return;
        }
        const filePath = path.join(UPLOADS_DIR, fileName);
        if (!isSafePathInside(UPLOADS_DIR, filePath)) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Forbidden' }));
            return;
        }
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: e.message }));
        }
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
