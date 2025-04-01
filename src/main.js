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
      const modelPath = `/models/${modelName}`;
      await loadModel(viewer, modelPath, modelType);
      return true;
    } catch (error) {
      console.error('自动加载模型失败:', error);
      return false;
    }
  }

  return false;
}

// main.js

import { autoLoadModel } from './autoLoad.js';

// 初始化应用程序
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化3D查看器 (假设您有一个Viewer类)
  const container = document.getElementById('viewer-container');
  const viewer = new Viewer(container);
  
  // 尝试自动加载模型
  const modelLoaded = await autoLoadModel(viewer);
  
  if (!modelLoaded) {
    // 如果没有自动加载模型，则初始化手动上传功能
    initManualUpload(viewer);
  }
});

// 初始化手动上传功能
function initManualUpload(viewer) {
  // ...existing code...
}