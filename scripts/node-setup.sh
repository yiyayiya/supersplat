#!/bin/bash
# 统一的Node.js环境设置和修复脚本

# 输出颜色定义
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m" # 无颜色

# 输出帮助信息
show_help() {
    echo -e "${YELLOW}SuperSplat Node.js 环境设置工具${NC}"
    echo ""
    echo "用法: $(basename "$0") [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help        显示帮助信息"
    echo "  -i, --install     安装 Node.js 环境"
    echo "  -f, --fix         修复 Node.js 路径问题"
    echo "  -u, --use         在当前会话中使用正确的 Node.js 版本"
    echo "  -d, --direct      直接安装 Node.js (不使用 NVM)"
    echo "  -c, --china       使用中国镜像源"
    echo ""
    echo "示例:"
    echo "  $(basename "$0") --install       # 安装 Node.js 环境"
    echo "  $(basename "$0") --fix           # 修复 Node.js 路径问题"
    echo "  $(basename "$0") --use           # 在当前会话中使用正确版本"
    echo "  $(basename "$0") -i -c           # 使用中国镜像源安装"
    echo ""
}

# 输出带颜色的文本
print_color() {
    local color="$1"
    local text="$2"
    echo -e "${color}${text}${NC}"
}

print_green() {
    print_color "$GREEN" "$1"
}

print_yellow() {
    print_color "$YELLOW" "$1"
}

print_red() {
    print_color "$RED" "$1"
}

# 检查是否已安装 NVM
check_nvm() {
    if [ -d "$HOME/.nvm" ]; then
        print_yellow "检测到 NVM 已安装，正在加载..."
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        if nvm --version >/dev/null 2>&1; then
            print_green "NVM 版本: $(nvm --version)"
            return 0
        fi
    fi
    print_yellow "未找到可用的 NVM 安装"
    return 1
}

# 使用国内镜像安装 NVM
install_nvm_china() {
    print_yellow "正在使用国内镜像安装 NVM..."
    
    # 创建 NVM 目录
    mkdir -p "$HOME/.nvm"
    
    # 使用 gitee 镜像下载 nvm.sh
    if curl -s -o "$HOME/.nvm/nvm.sh" https://gitee.com/mirrors/nvm/raw/master/nvm.sh; then
        curl -s -o "$HOME/.nvm/nvm-exec" https://gitee.com/mirrors/nvm/raw/master/nvm-exec
        chmod +x "$HOME/.nvm/nvm-exec"
        
        # 配置 NVM
        echo 'export NVM_DIR="$HOME/.nvm"' >> "$HOME/.bashrc"
        echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> "$HOME/.bashrc"
        
        # 添加镜像站点配置
        echo 'export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node' >> "$HOME/.bashrc"
        
        # 配置当前会话的 NVM
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
        
        print_green "NVM 从国内镜像安装成功！"
        return 0
    else
        print_red "NVM 从国内镜像安装失败。"
        return 1
    fi
}

# 安装 NVM
install_nvm() {
    print_yellow "正在安装 NVM..."
    
    if [ "$USE_CHINA_MIRROR" = "true" ]; then
        install_nvm_china
        return $?
    fi
    
    # 尝试从官方源安装
    if curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash; then
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        
        if command -v nvm >/dev/null 2>&1; then
            print_green "NVM 安装成功！"
            return 0
        fi
    fi
    
    print_yellow "官方源安装失败，尝试使用国内镜像..."
    install_nvm_china
    return $?
}

# 使用 NVM 安装 Node.js
install_nodejs_with_nvm() {
    print_yellow "正在安装 Node.js LTS 版本..."
    
    # 设置 npm 镜像
    if [ "$USE_CHINA_MIRROR" = "true" ]; then
        npm config set registry https://registry.npmmirror.com
    fi
    
    # 安装最新 LTS 版本
    if nvm install --lts; then
        nvm use --lts
        nvm alias default 'lts/*'
        
        # 设置 PATH 以确保使用正确的 Node.js 版本
        NODE_PATH=$(nvm which current)
        NODE_BIN_DIR=$(dirname "$NODE_PATH")
        export PATH="$NODE_BIN_DIR:$PATH"
        
        # 验证安装
        NODE_VERSION=$(node -v)
        NPM_VERSION=$(npm -v)
        NODE_PATH=$(which node)
        
        print_green "Node.js 安装成功！"
        print_green "Node 版本: $NODE_VERSION"
        print_green "NPM 版本: $NPM_VERSION"
        print_green "Node 路径: $NODE_PATH"
        
        # 添加到 .bashrc 以确保永久生效
        if ! grep -q "nvm use --lts --silent" ~/.bashrc; then
            echo "" >> ~/.bashrc
            echo "# 自动切换到 NVM 安装的 Node.js" >> ~/.bashrc
            echo "nvm use --lts --silent" >> ~/.bashrc
        fi
        
        return 0
    else
        print_red "Node.js 安装失败。"
        return 1
    fi
}

# 直接安装 Node.js（不使用 NVM）
direct_install_nodejs() {
    print_yellow "执行 Node.js 直接安装..."
    
    # 创建临时目录
    TMP_DIR="$HOME/tmp_node_install"
    mkdir -p "$TMP_DIR"
    cd "$TMP_DIR" || return 1
    
    # 设置 Node.js 版本
    NODE_VERSION="20.12.2"
    DISTRO="linux-x64"
    
    print_yellow "下载 Node.js $NODE_VERSION..."
    
    # 尝试从多个源下载
    download_success=false
    
    # 如果指定使用中国镜像
    if [ "$USE_CHINA_MIRROR" = "true" ]; then
        if wget -c -t 2 -T 10 "https://npmmirror.com/mirrors/node/v$NODE_VERSION/node-v$NODE_VERSION-$DISTRO.tar.xz"; then
            download_success=true
        fi
    else
        # 尝试官方源
        if wget -c -t 2 -T 10 "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-$DISTRO.tar.xz"; then
            download_success=true
        # 备用官方源
        elif wget -c -t 2 -T 10 "https://nodejs.org/download/release/v$NODE_VERSION/node-v$NODE_VERSION-$DISTRO.tar.xz"; then
            download_success=true
        # 国内镜像源
        elif wget -c -t 2 -T 10 "https://npmmirror.com/mirrors/node/v$NODE_VERSION/node-v$NODE_VERSION-$DISTRO.tar.xz"; then
            download_success=true
        fi
    fi
    
    if [ "$download_success" = "true" ]; then
        print_green "下载成功！"
        
        print_yellow "解压 Node.js..."
        tar -xf "node-v$NODE_VERSION-$DISTRO.tar.xz"
        
        # 创建用户本地目录
        mkdir -p "$HOME/node"
        print_yellow "安装 Node.js 到用户目录..."
        cp -r "node-v$NODE_VERSION-$DISTRO"/* "$HOME/node/"
        
        # 将路径添加到当前会话
        export PATH="$HOME/node/bin:$PATH"
        
        # 将路径永久添加到 .bashrc
        if ! grep -q "export PATH=\$HOME/node/bin:\$PATH" "$HOME/.bashrc"; then
            echo 'export PATH=$HOME/node/bin:$PATH' >> "$HOME/.bashrc"
            print_green "Node.js 路径已添加到 .bashrc"
        fi
        
        # 清理
        cd "$HOME" || return 1
        rm -rf "$TMP_DIR"
        
        # 设置 npm 镜像
        if [ "$USE_CHINA_MIRROR" = "true" ]; then
            npm config set registry https://registry.npmmirror.com
            print_green "已设置 NPM 使用中国镜像"
        fi
        
        print_green "Node.js 已安装到 $HOME/node"
        
        # 验证安装
        NODE_VERSION=$(node -v)
        NPM_VERSION=$(npm -v)
        NODE_PATH=$(which node)
        
        print_green "Node 版本: $NODE_VERSION"
        print_green "NPM 版本: $NPM_VERSION"
        print_green "Node 路径: $NODE_PATH"
        
        return 0
    else
        print_red "下载失败。请检查网络连接或手动安装 Node.js。"
        return 1
    fi
}

# 安装全局开发工具
install_global_tools() {
    print_yellow "正在安装项目需要的全局工具..."
    
    # 安装 serve 和 concurrently
    if npm install -g serve concurrently; then
        print_green "开发工具安装成功！"
        return 0
    else
        print_red "开发工具安装失败。"
        return 1
    fi
}

# 修复 Node.js 路径
fix_node_path() {
    print_yellow "检查 Node.js 路径问题..."
    
    # 先检查 NVM
    if check_nvm; then
        print_yellow "NVM 已正确加载，尝试切换到 LTS 版本..."
        nvm use --lts || nvm use node
    else
        print_yellow "尝试查找已安装的 Node.js..."
    fi
    
    # 检查 NVM 安装的 Node.js
    if [ -d "$HOME/.nvm/versions/node" ]; then
        # 查找最新的 Node.js 版本目录
        LATEST_NODE=$(find "$HOME/.nvm/versions/node" -maxdepth 1 -type d | grep -E 'v[0-9]+' | sort -V | tail -n 1)
        
        if [ -n "$LATEST_NODE" ] && [ -d "$LATEST_NODE/bin" ]; then
            print_green "找到 NVM 安装的 Node.js: $LATEST_NODE"
            export PATH="$LATEST_NODE/bin:$PATH"
            print_green "已将 Node.js 路径添加到 PATH"
        fi
    fi
    
    # 检查手动安装的 Node.js
    if [ -d "$HOME/node/bin" ]; then
        print_green "找到手动安装的 Node.js: $HOME/node/bin"
        export PATH="$HOME/node/bin:$PATH"
        print_green "已将 Node.js 路径添加到 PATH"
    fi
    
    # 验证当前 Node.js 版本
    NODE_VERSION=$(node -v 2>/dev/null || echo "未找到 Node.js")
    NODE_PATH=$(which node 2>/dev/null || echo "未找到路径")
    
    print_yellow "当前 Node.js 版本: $NODE_VERSION (路径: $NODE_PATH)"
    
    # 检查是否仍然使用旧版本
    if echo "$NODE_VERSION" | grep -q "v10"; then
        print_yellow "检测到旧版本的 Node.js，可能需要安装新版本或修复路径"
        print_yellow "建议执行: $0 --install"
        return 1
    fi
    
    # 添加自动加载配置到 .bashrc
    if ! grep -q "# SuperSplat Node.js 环境配置" "$HOME/.bashrc"; then
        print_yellow "添加环境配置到 .bashrc..."
        cat >> "$HOME/.bashrc" << EOF

# SuperSplat Node.js 环境配置
# NVM 加载
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
[ -s "\$NVM_DIR/bash_completion" ] && \. "\$NVM_DIR/bash_completion"

# 自动使用 LTS 版本
if command -v nvm &> /dev/null; then
    nvm use --lts --silent
fi

# 手动安装的 Node.js 路径
if [ -d "\$HOME/node/bin" ]; then
    export PATH="\$HOME/node/bin:\$PATH"
fi
EOF
        print_green "配置已添加到 .bashrc"
    fi
    
    print_green "Node.js 路径已修复！"
    return 0
}

# 在当前会话中使用正确的 Node.js 版本
use_correct_node() {
    print_yellow "设置当前会话的 Node.js 环境..."
    
    # 加载 NVM
    export NVM_DIR="$HOME/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        . "$NVM_DIR/nvm.sh"
        
        # 如果 NVM 可用，使用它来设置 Node.js 版本
        if command -v nvm &> /dev/null; then
            print_yellow "使用 NVM 设置 Node.js 版本..."
            nvm use --lts || nvm use node || print_yellow "无法使用 NVM 设置版本"
        fi
    fi
    
    # 检查手动安装的 Node.js
    if [ -d "$HOME/node/bin" ]; then
        print_yellow "添加手动安装的 Node.js 到 PATH..."
        export PATH="$HOME/node/bin:$PATH"
    fi
    
    # 检查 NVM 安装的 Node.js
    if [ -d "$HOME/.nvm/versions/node" ]; then
        # 获取最新版本的目录
        LATEST_NODE=$(find "$HOME/.nvm/versions/node" -maxdepth 1 -type d | grep -E 'v[0-9]+' | sort -V | tail -n 1)
        
        if [ -n "$LATEST_NODE" ] && [ -d "$LATEST_NODE/bin" ]; then
            print_yellow "添加 NVM 安装的 Node.js 到 PATH: $LATEST_NODE/bin"
            export PATH="$LATEST_NODE/bin:$PATH"
        fi
    fi
    
    # 显示当前 Node.js 信息
    NODE_VERSION=$(node -v 2>/dev/null || echo "未找到 Node.js")
    NODE_PATH=$(which node 2>/dev/null || echo "未找到 node 路径")
    NPM_VERSION=$(npm -v 2>/dev/null || echo "未找到 npm")
    
    print_green "====== Node.js 信息 ======"
    print_green "Node 版本: $NODE_VERSION"
    print_green "Node 路径: $NODE_PATH"
    print_green "NPM 版本: $NPM_VERSION"
    print_green "=========================="
    
    if [[ "$NODE_VERSION" != "未找到"* ]]; then
        print_green "Node.js 设置成功！"
        return 0
    else
        print_red "找不到可用的 Node.js，请执行安装操作"
        print_yellow "建议执行: $0 --install"
        return 1
    fi
}

# 检查并设置项目环境
setup_project_env() {
    PROJECT_DIR="/media/kuangbiao/workspaces/code/supersplat"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_green "======================================"
        print_green "SuperSplat 项目环境已就绪"
        print_green "项目路径: $PROJECT_DIR"
        print_green ""
        print_green "启动项目命令:"
        print_green "cd \"$PROJECT_DIR\" && npm install && npm run develop"
        print_green "======================================"
    fi
}

# 主函数
main() {
    # 默认行为
    ACTION="help"
    USE_CHINA_MIRROR="false"
    
    # 解析命令行参数
    while [ $# -gt 0 ]; do
        case "$1" in
            -h|--help)
                ACTION="help"
                ;;
            -i|--install)
                ACTION="install"
                ;;
            -f|--fix)
                ACTION="fix"
                ;;
            -u|--use)
                ACTION="use"
                ;;
            -d|--direct)
                ACTION="direct"
                ;;
            -c|--china)
                USE_CHINA_MIRROR="true"
                ;;
            *)
                print_red "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done
    
    # 根据选定的操作执行任务
    case "$ACTION" in
        help)
            show_help
            ;;
        install)
            print_green "=========================================="
            print_green "   Node.js 安装助手"
            print_green "=========================================="
            
            # 安装 NVM 和 Node.js
            if ! check_nvm; then
                if ! install_nvm; then
                    print_red "NVM 安装失败，请重试或选择直接安装 Node.js"
                    exit 1
                fi
            fi
            
            # 使用 NVM 安装 Node.js
            install_nodejs_with_nvm
            
            # 安装全局工具
            install_global_tools
            
            # 设置项目环境
            setup_project_env
            ;;
        fix)
            print_green "=========================================="
            print_green "   Node.js 路径修复工具"
            print_green "=========================================="
            
            fix_node_path
            
            # 设置项目环境
            setup_project_env
            ;;
        use)
            print_green "=========================================="
            print_green "   Node.js 环境激活工具"
            print_green "=========================================="
            
            use_correct_node
            
            # 设置项目环境
            setup_project_env
            ;;
        direct)
            print_green "=========================================="
            print_green "   Node.js 直接安装工具"
            print_green "=========================================="
            
            direct_install_nodejs
            
            # 安装全局工具
            install_global_tools
            
            # 设置项目环境
            setup_project_env
            ;;
    esac
    
    if [ "$ACTION" != "help" ]; then
        print_green "======================================"
        print_green "操作完成！要使设置在当前会话中生效，请运行:"
        print_green "  source ~/.bashrc"
        print_green "或者打开一个新的终端窗口"
        print_green "======================================"
    fi
}

# 执行主函数
main "$@"
