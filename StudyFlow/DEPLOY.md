# StudyFlow 部署指南 (公网发布)

本指南将帮助你使用云服务器和 Docker 将 StudyFlow 部署到公网。

## 1. 准备工作

### 购买服务器
*   建议购买一台云服务器（阿里云/腾讯云/华为云/AWS 均可）。
*   **配置推荐**：2核 CPU，2GB 内存（最小 1核2G），操作系统选择 **Ubuntu 22.04** 或 **Debian 11/12**。
*   **安全组设置**：确保服务器防火墙开放了 **80** 端口（HTTP）和 **22** 端口（SSH）。

### 安装 Docker
登录到你的服务器，运行以下命令一键安装 Docker：

```bash
curl -fsSL https://get.docker.com | bash
```

## 2. 上传代码

你可以使用 Git 或 SCP 上传代码。

### 方式 A：使用 Git (推荐)
1.  将你的代码推送到 GitHub/Gitee。
2.  在服务器上克隆代码：
    ```bash
    git clone https://github.com/your-username/StudyFlow.git
    cd StudyFlow
    ```

### 方式 B：直接上传
使用 SCP 或 SFTP 工具将本地项目文件夹上传到服务器。

## 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
cp backend/.env .env
# 或者直接创建
nano .env
```

填入你的配置信息：

```ini
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxx
GITHUB_TOKEN=your_github_token
GITHUB_REPO=facebook/react
```

## 4. 启动服务

在项目根目录下运行：

```bash
docker compose up --build -d
```

*   `--build`: 确保构建最新的镜像。
*   `-d`: 在后台运行。

## 5. 访问网站

打开浏览器，输入你的服务器 **公网 IP 地址**（例如 `http://1.2.3.4`），即可访问 StudyFlow。

*   无需输入端口号（Nginx 已监听 80 端口）。
*   API 请求会自动转发到后端。

## 常见问题

**Q: 无法访问网页？**
A: 请检查云服务商控制台的“安全组”或“防火墙”设置，确保 **80 端口** 已对外开放。

**Q: 想要使用 HTTPS？**
A: 你需要修改 `nginx/nginx.conf` 配置 SSL 证书，并开放 443 端口。

**Q: 数据库在哪里？**
A: 数据库文件位于 `backend/studyflow.db`，已通过 Docker 卷挂载，重启容器不会丢失数据。
