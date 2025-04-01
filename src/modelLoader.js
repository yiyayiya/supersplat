/**
 * 加载模型的辅助函数
 * @param {Object} viewer - 查看器实例
 * @param {string} path - 模型路径
 * @param {string} type - 模型类型
 * @returns {Promise<boolean>} - 是否加载成功
 */
export async function loadModel(viewer, path, type) {
    console.log(`[modelLoader] 加载模型: ${path}, 类型: ${type}`);
    
    // 如果viewer有自己的loadModel方法，优先使用
    if (typeof viewer.loadModel === 'function') {
        return await viewer.loadModel(path, type);
    }
    
    // 如果viewer有scene和events对象，尝试使用events.invoke
    if (viewer.events && typeof viewer.events.invoke === 'function') {
        return await viewer.events.invoke('import', path, type);
    }
    
    throw new Error('无法加载模型: 查看器缺少必要的加载方法');
}
