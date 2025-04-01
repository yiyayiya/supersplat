
// 全局变量
let app = null;
let viewer = null;

// 添加版本信息
const VERSION = "2.0.0";
console.log(`[autoLoad1] 脚本版本: ${VERSION}`);

// 初始化函数
function init() {
    // 等待app对象初始化
    if (typeof window.app === 'undefined') {
        setTimeout(init, 100);
        return;
    }
    
    app = window.app;
    viewer = app.viewer || {};
    
    // 解析URL参数并自动加载模型
    autoLoadModel();
}

// 从URL解析参数
function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const model = urlParams.get('model');
    const type = urlParams.get('type');
    
    return { model, type };
}

// 自动加载模型主函数
function _autoLoadModel() {
    const { model, type } = parseUrlParams();
    if (!model) return false;
    
    // 构建可能的模型路径
    let modelUrls = [];
    
    if (type) {
        // 如果提供了类型，尝试直接加载
        modelUrls.push(`/models/${model}/${model}.${type}`);
    } else {
        // 常见格式的尝试列表
        ['splat', 'ply', 'glb', 'json'].forEach(format => {
            modelUrls.push(`/models/${model}/${model}.${format}`);
        });
    }
    
    // 尝试验证并加载第一个可用的URL
    tryLoadModelFromUrls(modelUrls, 0);
    return true;
}

// 递归尝试URL列表
function tryLoadModelFromUrls(urls, index) {
    if (index >= urls.length) {
        console.error("没有找到可用的模型文件");
        return;
    }
    
    const modelUrl = urls[index];
    
    // 使用HEAD请求检查文件是否存在
    fetch(modelUrl, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) throw new Error(`文件不存在: ${modelUrl}`);
            
            // 提取文件扩展名
            const ext = modelUrl.split('.').pop().toLowerCase();
            const modelName = modelUrl.split('/').pop();
            
            loadModelFile(modelUrl, modelName, ext);
        })
        .catch(() => {
            // 尝试下一个URL
            tryLoadModelFromUrls(urls, index + 1);
        });
}

// 加载模型文件
function loadModelFile(modelUrl, modelName, ext) {
    fetch(modelUrl)
        .then(response => {
            if (!response.ok) throw new Error(`获取文件失败: ${response.status}`);
            return response.blob();  // 改用blob以保持mime-type
        })
        .then(blob => {
            return loadModelWithBlob(blob, modelName, ext);
        })
        .catch(error => {
            console.error("获取模型文件失败:", error);
        });
}

// 使用不同的方法尝试加载模型
async function loadModelWithBlob(blob, modelName, ext) {
    try {
        // 创建文件对象，使用正确的mime-type
        const mimeType = getFileTypeByExtension(ext);
        const file = new File([blob], modelName, { type: mimeType });
        
        // 按优先级尝试不同的加载方法
        const loadMethods = [
            trySceneAssetLoader,
            tryFileDroppedEvent,
            tryImportEvent,
            tryAssetLoader,
            tryLoadModelMethod
        ];
        
        for (const method of loadMethods) {
            try {
                const result = await method(blob, file, modelName, ext);
                if (result) {
                    return true;
                }
            } catch (err) {
                // 继续尝试下一个方法
            }
        }
        
        return false;
    } catch (e) {
        console.error("模型加载失败:", e);
        return false;
    }
}

// 1. 尝试使用scene.assetLoader
async function trySceneAssetLoader(blob, file, modelName, ext) {
    if (!app?.scene?.assetLoader) return false;
    
    const objectUrl = URL.createObjectURL(blob);
    
    try {
        const model = await app.scene.assetLoader.loadModel({ 
            url: objectUrl,
            filename: modelName,
            contents: blob
        });
        
        if (model) {
            app.scene.add(model);
            if (app.scene.camera?.focus) {
                app.scene.camera.focus();
            }
            return true;
        }
        return false;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

// 2. 尝试使用file.dropped事件
async function tryFileDroppedEvent(blob, file, modelName, ext) {
    if (!app?.events?.invoke) return false;
    
    app.events.invoke('file.dropped', file);
    return true;
}

// 3. 尝试使用import事件
async function tryImportEvent(blob, file, modelName, ext) {
    if (!app?.events?.invoke) return false;
    
    const objectUrl = URL.createObjectURL(blob);
    
    try {
        app.events.invoke('import', objectUrl, modelName, true);
        
        // 延迟一点时间以确保加载处理开始
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    } finally {
        // 延迟释放URL以确保加载完成
        setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
    }
}

// 4. 尝试使用assetLoader
async function tryAssetLoader(blob, file, modelName, ext) {
    if (!app?.assetLoader) return false;
    
    const arrayBuffer = await blob.arrayBuffer();
    
    if (ext === 'ply' && typeof app.assetLoader.loadPly === 'function') {
        await app.assetLoader.loadPly({
            contents: arrayBuffer,
            filename: modelName
        });
        return true;
    }
    
    if (ext === 'splat' && typeof app.assetLoader.loadSplat === 'function') {
        await app.assetLoader.loadSplat({
            contents: arrayBuffer,
            filename: modelName
        });
        return true;
    }
    
    return false;
}

// 5. 尝试使用loadModel方法
async function tryLoadModelMethod(blob, file, modelName, ext) {
    if (typeof app?.loadModel !== 'function') return false;
    
    const arrayBuffer = await blob.arrayBuffer();
    await app.loadModel(arrayBuffer, ext);
    return true;
}

// 辅助函数：根据扩展名获取文件类型
function getFileTypeByExtension(ext) {
    const mimeTypes = {
        'ply': 'application/octet-stream',
        'splat': 'application/octet-stream',
        'json': 'application/json',
        'glb': 'model/gltf-binary'
    };
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// 提供导出函数，便于模块导入
export function autoLoadModel(customViewer) {
    // 如果提供了自定义viewer，临时使用它
    if (customViewer) {
        const originalApp = app;
        const originalViewer = viewer;
        
        try {
            app = customViewer;
            viewer = customViewer;
            return _autoLoadModel();
        } finally {
            // 恢复原始值
            app = originalApp;
            viewer = originalViewer;
        }
    } else {
        return _autoLoadModel();
    }
}

// 导出URL解析函数
export { parseUrlParams };

// 加载脚本时自动初始化
init();

// 提供全局访问点，方便手动触发
window.reloadModel = autoLoadModel;
window.autoLoadVersion = VERSION;
