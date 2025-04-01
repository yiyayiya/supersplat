/**
 * 从URL解析模型参数
 */
export function parseUrlParams(): { model: string | null; type: string | null };

// 定义Viewer接口，更明确地指定app对象的结构
export interface Viewer {
    loadModel: (path: string, type: string) => Promise<boolean>;
    resetCamera?: () => boolean;
    getModelStats?: () => { vertices: number; faces: number | null } | null;
    scene?: any;
    events?: any;
}

/**
 * 尝试自动加载模型
 * @param viewer - 3D查看器实例
 * @returns 返回是否成功加载模型
 */
export function autoLoadModel(viewer: Viewer): Promise<boolean>;
