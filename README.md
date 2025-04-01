# SuperSplat - 3D Gaussian Splat Editor

| [SuperSplat Editor](https://superspl.at/editor) | [User Guide](https://github.com/playcanvas/supersplat/wiki) | [Forum](https://forum.playcanvas.com/) | [Discord](https://discord.gg/RSaMRzg) |

SuperSplat is a free and open source tool for inspecting, editing, optimizing and publishing 3D Gaussian Splats. It is built on web technologies and runs in the browser, so there's nothing to download or install.

A live version of this tool is available at: https://playcanvas.com/supersplat/editor

![image](https://github.com/user-attachments/assets/b6cbb5cc-d3cc-4385-8c71-ab2807fd4fba)

To learn more about using SuperSplat, please refer to the [User Guide](https://github.com/playcanvas/supersplat/wiki).

## Local Development

To initialize a local development environment for SuperSplat, ensure you have [Node.js](https://nodejs.org/) 18 or later installed. Follow these steps:

如果 node 版本低于 18，则先执行 node 安装脚本

 ```sh
   bash scripts/node-setup.sh --install
```

1. Clone the repository:

   ```sh
   git clone https://github.com/playcanvas/supersplat.git
   cd supersplat
   ```

2. Install dependencies:

   ```sh
   npm install
   npm install chokidar --save-dev
   ```

3. Build SuperSplat and start a local web server:

   ```sh
   npm run develop
   ```

4. Open a web browser at `http://localhost:3000`.

When changes to the source are detected, SuperSplat is rebuilt automatically. Simply refresh your browser to see your changes.

When running your local build of SuperSplat in Chrome, we recommend you have the Developer Tools panel open. Also:

1. Visit the Network tab and check `Disable cache`.
2. Visit the Application tab, select `Service workers` on the left and then check `Update on reload` and `Bypass for network`. 




# 使用PM2 运行

## 安装 PM2
npm install -g pm2

## 进入项目目录
cd supersplat

## 使用 PM2 启动服务
pm2 start npm --name "supersplat" -- run develop

## 其他常用 PM2 命令

```shell 
pm2 list            # 查看运行状态
pm2 logs supersplat # 查看日志
pm2 restart supersplat # 重启服务
pm2 save            # 保存当前进程列表
pm2 startup         # 设置开机自启动
```

## Contributors

SuperSplat is made possible by our amazing open source community:

<a href="https://github.com/playcanvas/supersplat/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=playcanvas/supersplat" />
</a>


