/**
 * SHADOWBORN: AWAKENING - Local Game Server
 * Zero-dependency Node.js HTTP server for real-time WebRTC webcam access.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${PORT}`;
    console.log(`====================================================`);
    console.log(` SHADOWBORN: AWAKENING - Real-Time Game Server`);
    console.log(` Game running at: ${url}`);
    console.log(` Close fist & punch forward in front of your webcam!`);
    console.log(`====================================================`);

    // Auto-open in default browser (Chrome / Edge)
    const startCmd = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
    exec(startCmd);
});
