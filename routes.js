import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 处理无扩展名的HTML文件访问
const handleNoExtension = (req, res, next) => {
  // 如果已经有扩展名，直接继续
  if (req.path.includes('.')) {
    return next();
  }
  
  // 首先尝试直接匹配已知页面
  const knownPages = ['/file-check', '/test-model-access', '/index-tools'];
  if (knownPages.includes(req.path)) {
    return res.sendFile(path.join(process.cwd(), 'public', `${req.path.substring(1)}.html`));
  }
  
  // 其次尝试加上.html后缀
  const htmlPath = `${req.path}.html`;
  const fullPath = path.join(process.cwd(), 'public', htmlPath.substring(1));
  
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (!err) {
      // 找到了HTML文件，直接发送
      return res.sendFile(fullPath);
    }
    // 继续下一个中间件
    next();
  });
};

// 应用无扩展名处理
router.use(handleNoExtension);

// 导出路由
export default router;
