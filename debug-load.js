/**
 * 模型加载调试工具 - 专门用于解决URL自动加载问题
 */

console.log('[DEBUG-LOAD] 模型加载调试工具已加载');

// 等待页面加载完成
window.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG-LOAD] 页面已加载，准备执行调试逻辑');
  
  // 检测URL参数
  const params = new URLSearchParams(window.location.search);
  const model = params.get('model');
  const type = params.get('type') || 'ply';
  
  if (model) {
    console.log(`[DEBUG-LOAD] 检测到模型参数: model=${model}, type=${type}`);
    
    // 等待app对象可用
    const checkForApp = () => {
      if (window.app) {
        console.log('[DEBUG-LOAD] 应用对象已可用，尝试加载模型');
        loadModelAlternative(window.app, model, type)
          .then(success => {
            console.log(`[DEBUG-LOAD] 模型${success ? '已成功' : '未能成功'}加载`);
          })
          .catch(err => {
            console.error('[DEBUG-LOAD] 加载失败:', err);
          });
      } else {
        console.log('[DEBUG-LOAD] 等待应用对象...');
        setTimeout(checkForApp, 500);
      }
    };
    
    // 开始检查app是否可用
    setTimeout(checkForApp, 1000);
  }
});

/**
 * 替代方法：尝试多种加载策略
 */
async function loadModelAlternative(app, model, type) {
  console.log(`[DEBUG-LOAD] 使用替代方法加载模型: ${model}.${type}`);
  
  // 路径策略
  const paths = [
    `/models/${model}/${model}.${type}`,
    `/models/${model}.${type}`
  ];
  
  // 尝试每种路径
  for (const path of paths) {
    try {
      console.log(`[DEBUG-LOAD] 尝试路径: ${path}`);
      
      // 1. 获取文件内容
      const response = await fetch(path);
      if (!response.ok) {
        console.log(`[DEBUG-LOAD] 路径无效: ${path}`);
        continue;
      }
      
      console.log(`[DEBUG-LOAD] 文件存在，尝试加载`);
      const blob = await response.blob();
      const file = new File([blob], `${model}.${type}`, { 
        type: type === 'ply' ? 'application/octet-stream' : blob.type 
      });
      
      // 2. 尝试多种加载方法
      
      // 方法1: 使用file.dropped事件
      if (app.events && typeof app.events.invoke === 'function') {
        try {
          console.log(`[DEBUG-LOAD] 尝试方法1: file.dropped`);
          await app.events.invoke('file.dropped', file);
          return true;
        } catch (err) {
          console.error(`[DEBUG-LOAD] 方法1失败:`, err);
        }
      }
      
      // 方法2: 使用import事件
      if (app.events && typeof app.events.invoke === 'function') {
        try {
          console.log(`[DEBUG-LOAD] 尝试方法2: import`);
          const objectUrl = URL.createObjectURL(blob);
          try {
            await app.events.invoke('import', objectUrl, type);
            return true;
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        } catch (err) {
          console.error(`[DEBUG-LOAD] 方法2失败:`, err);
        }
      }
      
      // 方法3: 直接使用loadModel方法
      if (typeof app.loadModel === 'function') {
        try {
          console.log(`[DEBUG-LOAD] 尝试方法3: loadModel`);
          const objectUrl = URL.createObjectURL(blob);
          try {
            await app.loadModel(objectUrl, type);
            return true;
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        } catch (err) {
          console.error(`[DEBUG-LOAD] 方法3失败:`, err);
        }
      }
    } catch (error) {
      console.error(`[DEBUG-LOAD] 处理路径失败: ${path}`, error);
    }
  }
  
  console.log(`[DEBUG-LOAD] 所有尝试均失败`);
  return false;
}
