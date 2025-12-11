# E:\Lego\lego-backend\generate_backend_summary.py
import os
from pathlib import Path
from datetime import datetime

def generate_backend_summary(root_dir='.', output_file='BACKEND_SUMMARY.md'):
    """
    自動生成後端項目摘要，包括：
    1. 文件結構樹
    2. 所有 .js 文件的內容
    3. package.json 內容
    4. .env 範例（隱藏敏感資訊）
    5. 資料庫結構
    """
    
    # 要忽略的目錄
    IGNORE_DIRS = {'node_modules', 'dist', 'build', '.git', '__pycache__', '.vscode', 'coverage'}
    
    # 要包含的文件類型
    INCLUDE_EXTENSIONS = {'.js', '.json', '.sql', '.md', '.env.example'}
    
    # 特殊處理：也讀取 .env 但會隱藏敏感資訊
    SENSITIVE_FILES = {'.env'}
    
    summary = []
    
    # ============ 1. 項目標題 ============
    summary.append("# 🚀 Lego Forum Backend - Project Summary\n\n")
    summary.append(f"**生成時間**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    summary.append(f"**項目路徑**: {Path(root_dir).resolve()}\n\n")
    
    summary.append("---\n\n")
    
    # ============ 2. 文件結構樹 ============
    summary.append("## 📁 Backend File Structure\n\n```\n")
    
    def print_tree(directory, prefix="", is_last=True):
        """遞歸打印目錄樹"""
        items = []
        try:
            items = sorted(Path(directory).iterdir(), key=lambda x: (not x.is_dir(), x.name))
        except PermissionError:
            return
        
        # 過濾掉忽略的目錄
        items = [item for item in items if item.name not in IGNORE_DIRS]
        
        for i, item in enumerate(items):
            is_last_item = i == len(items) - 1
            current_prefix = "└── " if is_last_item else "├── "
            
            # 文件大小
            size_info = ""
            if item.is_file():
                try:
                    size = item.stat().st_size
                    if size < 1024:
                        size_info = f" ({size}B)"
                    elif size < 1024 * 1024:
                        size_info = f" ({size/1024:.1f}KB)"
                    else:
                        size_info = f" ({size/1024/1024:.1f}MB)"
                except:
                    pass
            
            summary.append(f"{prefix}{current_prefix}{item.name}{size_info}\n")
            
            if item.is_dir():
                extension = "    " if is_last_item else "│   "
                print_tree(item, prefix + extension, is_last_item)
    
    print_tree(root_dir)
    summary.append("```\n\n")
    
    summary.append("---\n\n")
    
    # ============ 3. Package.json 快速預覽 ============
    summary.append("## 📦 Dependencies Overview\n\n")
    
    package_json_path = Path(root_dir) / 'package.json'
    if package_json_path.exists():
        try:
            import json
            with open(package_json_path, 'r', encoding='utf-8') as f:
                pkg = json.load(f)
                
            summary.append("### Production Dependencies\n\n")
            if 'dependencies' in pkg:
                for dep, version in pkg['dependencies'].items():
                    summary.append(f"- `{dep}`: {version}\n")
            summary.append("\n")
            
            summary.append("### Development Dependencies\n\n")
            if 'devDependencies' in pkg:
                for dep, version in pkg['devDependencies'].items():
                    summary.append(f"- `{dep}`: {version}\n")
            summary.append("\n")
            
        except Exception as e:
            summary.append(f"⚠️ 無法解析 package.json: {e}\n\n")
    
    summary.append("---\n\n")
    
    # ============ 4. 文件內容 ============
    summary.append("## 📄 Source Code Files\n\n")
    
    def collect_files(directory, files_dict):
        """收集所有需要的文件"""
        try:
            for item in Path(directory).rglob('*'):
                # 跳過目錄
                if item.is_dir():
                    continue
                    
                # 跳過忽略的目錄中的文件
                if any(ignore in item.parts for ignore in IGNORE_DIRS):
                    continue
                
                # 檢查文件擴展名
                if item.suffix in INCLUDE_EXTENSIONS or item.name in SENSITIVE_FILES:
                    rel_path = item.relative_to(root_dir)
                    files_dict[str(rel_path)] = item
                    
        except Exception as e:
            print(f"Error collecting files: {e}")
    
    files_dict = {}
    collect_files(root_dir, files_dict)
    
    # 文件分類
    category_order = {
        'package.json': 1,
        '.env': 2,
        '.env.example': 2,
        'server.js': 3,
        'db.js': 4,
        'routes': 5,
        'middleware': 6,
        'controllers': 7,
        'models': 8,
        'utils': 9,
        'config': 10,
        '.sql': 11,
    }
    
    def get_category_priority(file_path):
        """根據文件路徑確定優先級"""
        for key, priority in category_order.items():
            if key in file_path:
                return priority
        return 99
    
    # 按分類和路徑排序
    sorted_files = sorted(files_dict.keys(), key=lambda x: (get_category_priority(x), x))
    
    current_category = None
    
    for file_path in sorted_files:
        file = files_dict[file_path]
        
        # 添加分類標題
        if 'routes' in file_path and current_category != 'routes':
            summary.append("### 🛣️ Routes (API Endpoints)\n\n")
            current_category = 'routes'
        elif 'middleware' in file_path and current_category != 'middleware':
            summary.append("### 🔒 Middleware\n\n")
            current_category = 'middleware'
        elif '.sql' in file_path and current_category != 'sql':
            summary.append("### 🗄️ Database Schemas\n\n")
            current_category = 'sql'
        
        summary.append(f"#### 📄 `{file_path}`\n\n")
        
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 處理敏感文件
            if file.name == '.env':
                summary.append("```env\n")
                summary.append("# ⚠️ 敏感資訊已隱藏，以下為結構範例：\n\n")
                for line in content.split('\n'):
                    if '=' in line and not line.strip().startswith('#'):
                        key = line.split('=')[0]
                        summary.append(f"{key}=***HIDDEN***\n")
                    else:
                        summary.append(f"{line}\n")
                summary.append("```\n\n")
                continue
            
            # 根據文件類型選擇語法高亮
            if file.suffix == '.js':
                lang = 'javascript'
            elif file.suffix == '.json':
                lang = 'json'
            elif file.suffix == '.sql':
                lang = 'sql'
            elif file.suffix == '.md':
                lang = 'markdown'
            elif file.name == '.env.example':
                lang = 'env'
            else:
                lang = ''
            
            summary.append(f"```{lang}\n{content}\n```\n\n")
            
        except Exception as e:
            summary.append(f"```\n⚠️ 無法讀取文件: {e}\n```\n\n")
    
    summary.append("---\n\n")
    
    # ============ 5. API 路由總覽 ============
    summary.append("## 🗺️ API Routes Overview\n\n")
    summary.append("### Authentication (`/api/auth`)\n\n")
    summary.append("- `POST /api/auth/register` - 用戶註冊\n")
    summary.append("- `POST /api/auth/login` - 用戶登入\n")
    summary.append("- `POST /api/auth/logout` - 用戶登出\n")
    summary.append("- `GET /api/auth/me` - 獲取當前用戶資料\n\n")
    
    summary.append("### Posts (`/api/posts`)\n\n")
    summary.append("- `GET /api/posts` - 獲取所有帖子\n")
    summary.append("- `GET /api/posts/:id` - 獲取單個帖子\n")
    summary.append("- `POST /api/posts` - 創建帖子（需登入）\n")
    summary.append("- `PUT /api/posts/:id` - 更新帖子（需登入）\n")
    summary.append("- `DELETE /api/posts/:id` - 刪除帖子（需登入）\n")
    summary.append("- `POST /api/posts/:id/like` - 點讚/取消點讚（需登入）\n\n")
    
    summary.append("---\n\n")
    
    # ============ 6. 資料庫結構 ============
    summary.append("## 🗄️ Database Schema\n\n")
    summary.append("### Tables\n\n")
    summary.append("1. **users** - 用戶資料\n")
    summary.append("2. **posts** - 帖子資料\n")
    summary.append("3. **parts** - 樂高配件資料\n")
    summary.append("4. **comments** - 留言資料\n")
    summary.append("5. **likes** - 點讚記錄\n\n")
    
    summary.append("---\n\n")
    
    # ============ 7. 環境變數說明 ============
    summary.append("## ⚙️ Environment Variables\n\n")
    summary.append("| 變數名稱 | 說明 | 範例值 |\n")
    summary.append("|---------|------|--------|\n")
    summary.append("| `PORT` | 伺服器端口 | `5000` |\n")
    summary.append("| `DB_USER` | 資料庫用戶名 | `postgres` |\n")
    summary.append("| `DB_HOST` | 資料庫主機 | `localhost` |\n")
    summary.append("| `DB_NAME` | 資料庫名稱 | `lego_forum` |\n")
    summary.append("| `DB_PASSWORD` | 資料庫密碼 | `your_password` |\n")
    summary.append("| `DB_PORT` | 資料庫端口 | `5432` |\n")
    summary.append("| `JWT_SECRET` | JWT 密鑰 | `your-secret-key` |\n\n")
    
    summary.append("---\n\n")
    
    # ============ 8. 統計資訊 ============
    summary.append("## 📊 Project Statistics\n\n")
    summary.append(f"- **總文件數**: {len(files_dict)}\n")
    
    # 統計各類型文件數量
    extensions_count = {}
    total_lines = 0
    for file in files_dict.values():
        ext = file.suffix if file.suffix else file.name
        extensions_count[ext] = extensions_count.get(ext, 0) + 1
        
        # 計算總行數
        try:
            with open(file, 'r', encoding='utf-8') as f:
                total_lines += len(f.readlines())
        except:
            pass
    
    summary.append(f"- **總代碼行數**: {total_lines:,}\n")
    summary.append(f"- **文件類型分佈**:\n")
    for ext, count in sorted(extensions_count.items()):
        summary.append(f"  - `{ext}`: {count} 個文件\n")
    
    summary.append("\n---\n\n")
    
    # ============ 9. 快速啟動指南 ============
    summary.append("## 🚀 Quick Start\n\n")
    summary.append("```bash\n")
    summary.append("# 1. 安裝依賴\n")
    summary.append("npm install\n\n")
    summary.append("# 2. 配置環境變數\n")
    summary.append("cp .env.example .env\n")
    summary.append("# 然後編輯 .env 填入你的資料庫資訊\n\n")
    summary.append("# 3. 初始化資料庫\n")
    summary.append("psql -U postgres -d lego_forum -f schema.sql\n\n")
    summary.append("# 4. 啟動開發伺服器\n")
    summary.append("npm run dev\n")
    summary.append("```\n\n")
    
    # 寫入文件
    output_path = Path(root_dir) / output_file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(summary)
    
    print(f"\n✅ Backend Summary 已生成!")
    print(f"📁 位置: {output_path.resolve()}")
    print(f"📊 共收集了 {len(files_dict)} 個文件")
    print(f"💾 總代碼行數: {total_lines:,}")
    print(f"\n請查看: {output_file}\n")

if __name__ == "__main__":
    # 在後端項目根目錄運行
    generate_backend_summary(root_dir='.', output_file='BACKEND_SUMMARY.md')