import './ui/scss/style.scss';
import { version as pcuiVersion, revision as pcuiRevision } from 'pcui';
import { version as engineVersion, revision as engineRevision } from 'playcanvas';

import { main } from './main';
import { version as appVersion } from '../package.json';
import { autoLoadModel } from './autoLoad1';

// print out versions of dependent packages
// NOTE: add dummy style reference to prevent tree shaking
console.log(`SuperSplat v${appVersion} | PCUI v${pcuiVersion} (${pcuiRevision}) | Engine v${engineVersion} (${engineRevision})`);

// 在初始化后，检查URL参数并尝试加载模型
async function initAndAutoLoad() {
    // 原始初始化代码 - 等待main()返回app实例
    const app = await main();

    // 设置全局app对象，供调试使用
    (window as any).app = app;

    // 应用初始化完成后，检查是否有模型参数
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('model')) {
            try {
                await autoLoadModel(app);
            } catch (loadError) {
                console.error('模型加载错误:', loadError);
            }
        }
    } catch (error) {
        console.error('自动加载模型失败:', error);
    }
}

// 调用新的初始化函数
initAndAutoLoad().catch(error => {
    console.error('应用初始化失败:', error);
});
