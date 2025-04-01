// autoLoad.js

import { loadModel } from './modelLoader.js';

/**
 * 尝试自动加载模型
 * @param {Viewer} viewer - 3D查看器实例
 * @returns {Promise<boolean>} - 返回是否成功加载模型
 */
export async function autoLoadModel(viewer) {
  const urlParams = new URLSearchParams(window.location.search);
  const modelName = urlParams.get('model');
  const modelType = urlParams.get('type');

  if (modelName) {
    try {
      // 修正：构建完整路径而不是仅仅目录
      let modelPath;
      if (modelType) {
        // 尝试两种可能的路径格式
        modelPath = `/models/${modelName}/${modelName}.${modelType}`;
        
        // 检查该路径是否存在
        try {
          const response = await fetch(modelPath, { method: 'HEAD' });
          if (!response.ok) {
            // 尝试备选路径
            const altPath = `/models/${modelName}.${modelType}`;
            const altResponse = await fetch(altPath, { method: 'HEAD' });
            if (altResponse.ok) {
              modelPath = altPath;
            } else {
              throw new Error(`找不到模型文件: ${modelName}.${modelType}`);
            }
          }
        } catch (error) {
          console.error('检查模型文件路径失败:', error);
          return false;
        }
      } else {
        // 如果没有指定类型，使用默认路径
        modelPath = `/models/${modelName}/${modelName}.ply`;
      }
      
      console.log(`尝试加载模型: ${modelPath}`);
      await loadModel(viewer, modelPath, modelType || 'ply');
      console.log(`模型 ${modelPath} 加载成功!`);
      return true;
    } catch (error) {
      console.error('自动加载模型失败:', error);
      alert(`加载模型失败: ${error.message}\n请检查模型文件是否存在。`);
      return false;
    }
  }

  return false;
}

// main.js

import { autoLoadModel } from './autoLoad.js';

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化3D查看器
    const viewer = initializeViewer();
    
    // 尝试自动加载模型
    const modelLoaded = await autoLoadModel(viewer);
    
    // 如果没有模型被自动加载，则初始化默认界面或上传界面
    if (!modelLoaded) {
        initDefaultView(viewer);
    }
});

/**
 * 初始化3D查看器
 * @returns {Object} viewer实例
 */
function initializeViewer() {
    // 获取渲染容器
    const container = document.getElementById('viewer-container') || document.createElement('div');
    if (!container.id) {
        container.id = 'viewer-container';
        document.body.appendChild(container);
    }
    
    // 创建并返回viewer对象
    // 根据实际应用替换为真实的viewer初始化代码
    return {
        loadModel: async (path, type) => {
            console.log(`[Viewer] 加载模型: ${path} (类型: ${type})`);
            // 实际的模型加载逻辑
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`无法加载模型文件: HTTP ${response.status}`);
                }
                
                // 处理加载结果
                console.log(`[Viewer] 模型文件加载成功，开始解析...`);
                
                // 此处应该是实际的模型解析和渲染代码
                // ...
                
                return true;
            } catch (error) {
                console.error(`[Viewer] 模型加载失败:`, error);
                return false;
            }
        }
    };
}

/**
 * 初始化默认视图
 */
function initDefaultView(viewer) {
    console.log('显示默认上传界面');
    // 显示默认的模型上传界面
}