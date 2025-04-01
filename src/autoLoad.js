/**
 * 自动加载模型的功能模块
 */

/**
 * 从URL解析模型参数
 * @returns {{model: string|null, type: string|null}} 解析出的模型名称和类型
 */
export function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    model: urlParams.get('model'),
    type: urlParams.get('type')
  };
}

/**
 * 尝试自动加载模型
 * @param {object} viewer - 3D查看器实例
 * @returns {Promise<boolean>} - 返回是否成功加载模型
 */
export async function autoLoadModel(viewer) {
  const { model, type } = parseUrlParams();
  
  if (!model) return false;
  
  try {
    let modelPath;
    let modelType = type;
    
    console.log(`尝试加载模型: ${model}, 类型: ${modelType || '自动检测'}`);
    
    // 定义可能的路径模式
    const pathPatterns = [
      `/models/${model}/${model}.${type || '{ext}'}`,  // /models/name/name.ext
      `/models/${model}.${type || '{ext}'}`,           // /models/name.ext
      // 添加额外的路径模式
      `/models/${model}/${model}/${model}.${type || '{ext}'}` // 某些情况下嵌套更深
    ];
    
    // 尝试各种可能的文件类型
    const fileTypes = ['ply', 'splat', 'obj', 'glb', 'gltf'];
    let fileFound = false;
    
    // 如果指定了类型，只尝试该类型
    const typesToTry = type ? [type] : fileTypes;
    
    // 逐一尝试所有可能的路径组合
    for (const pattern of pathPatterns) {
      if (fileFound) break;
      
      for (const ext of typesToTry) {
        // 替换路径中的{ext}占位符
        const testPath = pattern.replace('{ext}', ext);
        if (testPath.includes('{ext}')) continue; // 跳过未完全替换的路径
        
        console.log(`尝试检测文件: ${testPath}`);
        try {
          // 使用HEAD请求检查文件是否存在 (更高效)
          const response = await fetch(testPath, { method: 'HEAD' });
          if (response.ok) {
            modelPath = testPath;
            modelType = ext;
            fileFound = true;
            console.log(`找到模型文件: ${testPath}`);
            break;
          }
        } catch (e) {
          console.log(`检测文件 ${testPath} 失败:`, e);
        }
      }
    }
    
    if (!fileFound) {
      console.error(`无法找到模型: ${model}`);
      alert(`无法找到模型文件: ${model}\n请确认模型文件已正确放置在服务器上。`);
      return false;
    }
    
    console.log(`自动加载模型: ${modelPath}, 类型: ${modelType}`);
    
    // 调用加载函数
    try {
      if (typeof viewer.loadModel === 'function') {
        await viewer.loadModel(modelPath, modelType);
      } else {
        // 尝试导入并使用modelLoader
        const { loadModel } = await import('./modelLoader.js');
        await loadModel(viewer, modelPath, modelType);
      }
      return true;
    } catch (error) {
      console.error('加载模型失败:', error);
      throw error;
    }
  } catch (error) {
    console.error('自动加载模型失败:', error);
    alert(`加载模型失败: ${error.message}`);
    return false;
  }
}
