import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8080;

// 模型文件存储路径 - 只保留public/models
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

// 添加模型诊断端点
app.get('/api/debug/check-model', (req, res) => {
  const modelName = req.query.model;
  const modelType = req.query.type || 'ply';
  
  if (!modelName) {
    return res.status(400).json({ error: '缺少模型名称参数' });
  }
  
  // 检查各种可能的路径
  const potentialPaths = [
    { 
      path: path.join(MODELS_DIR, modelName, `${modelName}.${modelType}`),
      type: 'public/models/{model}/{model}.{type}'
    },
    { 
      path: path.join(MODELS_DIR, `${modelName}.${modelType}`),
      type: 'public/models/{model}.{type}'
    }
  ];
  
  const results = potentialPaths.map(item => {
    const exists = fs.existsSync(item.path);
    const stats = exists ? fs.statSync(item.path) : null;
    
    return {
      type: item.type,
      path: item.path,
      exists,
      fileSize: stats ? stats.size : null,
      isFile: stats ? stats.isFile() : null,
      webPath: item.path.replace(MODELS_DIR, '/models')
    };
  });
  
  res.json({
    model: modelName,
    type: modelType,
    paths: results,
    foundValidPath: results.some(r => r.exists && r.isFile)
  });
});

// 为模型文件提供动态文件服务
app.use('/models', (req, res, next) => {
  const modelPath = path.join(MODELS_DIR, req.path);
  
  // 检查文件是否存在于模型目录
  if (fs.existsSync(modelPath) && fs.statSync(modelPath).isFile()) {
    console.log(`从public/models提供文件: ${modelPath}`);
    return res.sendFile(modelPath);
  }
  
  next();
});

// 为dist目录提供静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 为public目录提供静态文件服务（用于调试页面）
app.use('/public', express.static(path.join(__dirname, 'public')));

// 添加调试页面路由
app.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'debug-model.html'));
});

// 处理SPA路由 - 所有不存在的路径返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`模型目录: ${MODELS_DIR}`);
  console.log(`调试页面: http://localhost:${port}/debug`);
});