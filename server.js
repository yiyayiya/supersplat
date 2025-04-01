import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

// 模型文件存储路径
const MODELS_DIR = path.join(__dirname, 'public', 'models');

// 确保模型目录存在
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// 实时监控模型目录的变化
const watcher = chokidar.watch(MODELS_DIR, {
  ignored: /(^|[\/\\])\../, // 忽略隐藏文件
  persistent: true
});

// 监控文件变化
watcher
  .on('add', path => console.log(`模型文件已添加: ${path}`))
  .on('change', path => console.log(`模型文件已变更: ${path}`))
  .on('unlink', path => console.log(`模型文件已删除: ${path}`));

// 记录请求
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 为模型文件提供动态文件服务，添加适合的MIME类型
app.use('/models', (req, res, next) => {
  const modelPath = path.join(MODELS_DIR, req.path);
  
  // 检查文件是否存在于模型目录
  if (fs.existsSync(modelPath) && fs.statSync(modelPath).isFile()) {
    // 根据文件扩展名设置正确的MIME类型
    const ext = path.extname(modelPath).toLowerCase();
    
    switch (ext) {
      case '.ply':
        res.set('Content-Type', 'application/octet-stream');
        break;
      case '.splat':
        res.set('Content-Type', 'application/octet-stream');
        break;
      case '.obj':
        res.set('Content-Type', 'text/plain');
        break;
      case '.glb':
        res.set('Content-Type', 'model/gltf-binary');
        break;
      case '.gltf':
        res.set('Content-Type', 'model/gltf+json');
        break;
    }
    
    // 提供文件服务
    res.sendFile(modelPath);
  } else {
    next();
  }
});

// 增强静态文件服务
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filepath) => {
    // 确保JavaScript文件使用正确的MIME类型
    if (filepath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.mjs')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    } else if (filepath.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
  }
}));

// 提供src目录中的文件（修复MIME类型）
app.use('/src', express.static(path.join(__dirname, 'src'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.mjs')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.ts')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// 特殊处理 autoLoad1.js 以确保其正确提供
app.get('/src/autoLoad1.js', (req, res) => {
  const autoLoadPath = path.join(__dirname, 'src', 'autoLoad1.js');
  
  if (fs.existsSync(autoLoadPath)) {
    res.set('Content-Type', 'application/javascript');
    res.sendFile(autoLoadPath);
  } else {
    res.status(404).send('// autoLoad1.js 文件不存在');
  }
});

// 增强SPA通配符路由
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  // 检查文件是否存在
  if (!fs.existsSync(indexPath)) {
    return res.status(500).send(`
      <h1>构建错误</h1>
      <p>dist/index.html 不存在，请确认项目已成功构建。</p>
      <p>尝试运行: npm run build</p>
    `);
  }
  
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`模型目录: ${MODELS_DIR}`);
  console.log(`自动加载示例: http://localhost:${port}/?model=point_cloud&type=ply`);
});