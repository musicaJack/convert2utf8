import os
import logging
import chardet
from ebooklib import epub
from bs4 import BeautifulSoup
import re
from .text_processor import TextProcessor

logger = logging.getLogger(__name__)

class EpubConverter:
    """EPUB转TXT转换器"""
    
    def __init__(self):
        self.text_processor = TextProcessor()
    
    def convert_to_txt(self, epub_path, output_dir, file_id):
        """
        将EPUB文件转换为TXT文件
        
        Args:
            epub_path: EPUB文件路径
            output_dir: 输出目录
            file_id: 文件ID
            
        Returns:
            dict: 转换结果
        """
        try:
            logger.info(f"开始转换EPUB文件: {epub_path}")
            
            # 读取EPUB文件
            book = epub.read_epub(epub_path)
            
            # 提取元数据
            metadata = self._extract_metadata(book)
            logger.info(f"提取到元数据: {metadata}")
            
            # 提取所有章节内容
            chapters = self._extract_chapters(book)
            logger.info(f"提取到 {len(chapters)} 个章节")
            
            # 合并章节内容
            full_text = self._merge_chapters(chapters, metadata)
            
            # 检测和转换编码
            text_utf8 = self._ensure_utf8(full_text)
            
            # 保存为TXT文件
            txt_path = os.path.join(output_dir, f"{file_id}.txt")
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(text_utf8)
            
            logger.info(f"转换完成，保存到: {txt_path}")
            
            return {
                'success': True,
                'converted_path': txt_path,
                'text_length': len(text_utf8),
                'chapters_count': len(chapters),
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"EPUB转换失败: {str(e)}")
            return {
                'success': False,
                'error': f'转换失败: {str(e)}'
            }
    
    def _extract_metadata(self, book):
        """提取EPUB元数据"""
        metadata = {
            'title': '未知标题',
            'author': '未知作者',
            'language': 'zh-CN',
            'publisher': '',
            'description': ''
        }
        
        try:
            # 提取标题
            if book.get_metadata('DC', 'title'):
                metadata['title'] = book.get_metadata('DC', 'title')[0][0]
            
            # 提取作者
            if book.get_metadata('DC', 'creator'):
                metadata['author'] = book.get_metadata('DC', 'creator')[0][0]
            
            # 提取语言
            if book.get_metadata('DC', 'language'):
                metadata['language'] = book.get_metadata('DC', 'language')[0][0]
            
            # 提取出版社
            if book.get_metadata('DC', 'publisher'):
                metadata['publisher'] = book.get_metadata('DC', 'publisher')[0][0]
            
            # 提取描述
            if book.get_metadata('DC', 'description'):
                metadata['description'] = book.get_metadata('DC', 'description')[0][0]
                
        except Exception as e:
            logger.warning(f"提取元数据时出错: {str(e)}")
        
        return metadata
    
    def _extract_chapters(self, book):
        """提取所有章节内容"""
        chapters = []
        
        try:
            # 首先尝试使用阅读顺序（spine）来获取章节
            if hasattr(book, 'spine') and book.spine:
                logger.info(f"使用阅读顺序提取章节，共 {len(book.spine)} 个项目")
                
                # 创建ID到item的映射
                items_dict = {}
                for item in book.get_items():
                    if hasattr(item, 'id'):
                        items_dict[item.id] = item
                    elif hasattr(item, 'file_name'):
                        # 如果没有id，使用文件名作为key
                        items_dict[item.file_name] = item
                
                for i, (item_id, linear) in enumerate(book.spine):
                    try:
                        # 根据ID获取对应的item
                        item = items_dict.get(item_id)
                        if item and hasattr(item, 'get_content'):
                            content = item.get_content()
                            if content:
                                html_content = content.decode('utf-8')
                                chapter_text = self._extract_text_from_html(html_content)
                                
                                if chapter_text.strip():
                                    chapters.append({
                                        'title': self._extract_chapter_title(html_content),
                                        'content': chapter_text
                                    })
                                    logger.info(f"提取章节 {i+1}: {chapters[-1]['title']}")
                    except Exception as e:
                        logger.warning(f"处理阅读顺序项目 {item_id} 时出错: {str(e)}")
                        continue
            
            # 如果阅读顺序为空，回退到原来的方法
            if not chapters:
                logger.info("阅读顺序为空，使用传统方法提取章节")
                
                # 获取所有文档
                for item in book.get_items():
                    # 兼容不同版本的ebooklib
                    is_document = False
                    try:
                        is_document = item.get_type() == epub.ITEM_DOCUMENT
                    except AttributeError:
                        # 如果没有ITEM_DOCUMENT属性，使用其他方法判断
                        if hasattr(item, 'get_type') and 'document' in str(item.get_type()).lower():
                            is_document = True
                        elif hasattr(item, 'file_name') and item.file_name.endswith('.xhtml'):
                            is_document = True
                    
                    if is_document:
                        # 解析HTML内容
                        html_content = item.get_content().decode('utf-8')
                        chapter_text = self._extract_text_from_html(html_content)
                        
                        if chapter_text.strip():
                            chapters.append({
                                'title': self._extract_chapter_title(html_content),
                                'content': chapter_text
                            })
                            
        except Exception as e:
            logger.error(f"提取章节时出错: {str(e)}")
        
        return chapters
    
    def _extract_text_from_html(self, html_content):
        """从HTML内容中提取纯文本"""
        try:
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 移除script和style标签
            for script in soup(["script", "style"]):
                script.decompose()
            
            # 获取文本内容
            text = soup.get_text()
            
            # 清理文本
            text = self.text_processor.clean_text(text)
            
            return text
            
        except Exception as e:
            logger.error(f"HTML文本提取失败: {str(e)}")
            return ""
    
    def _extract_chapter_title(self, html_content):
        """提取章节标题"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # 尝试多种标题标签
            title_selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title']
            
            for selector in title_selectors:
                title_elem = soup.find(selector)
                if title_elem and title_elem.get_text().strip():
                    return title_elem.get_text().strip()
            
            return "未知章节"
            
        except Exception as e:
            logger.warning(f"提取章节标题失败: {str(e)}")
            return "未知章节"
    
    def _merge_chapters(self, chapters, metadata):
        """合并所有章节内容"""
        try:
            # 构建完整的文本内容
            full_text = []
            
            # 添加标题页
            full_text.append(f"标题：{metadata['title']}")
            full_text.append(f"作者：{metadata['author']}")
            if metadata['publisher']:
                full_text.append(f"出版社：{metadata['publisher']}")
            full_text.append("=" * 50)
            full_text.append("")
            
            # 添加章节内容（不添加章节编号）
            for chapter in chapters:
                full_text.append(chapter['content'])
                full_text.append("")
            
            return "\n".join(full_text)
            
        except Exception as e:
            logger.error(f"合并章节失败: {str(e)}")
            return ""
    
    def _ensure_utf8(self, text):
        """确保文本为UTF-8编码"""
        try:
            # 检测文本编码
            if isinstance(text, str):
                return text
            
            # 如果是bytes，检测编码并转换
            if isinstance(text, bytes):
                detected = chardet.detect(text)
                encoding = detected['encoding'] or 'utf-8'
                return text.decode(encoding, errors='ignore')
            
            return str(text)
            
        except Exception as e:
            logger.error(f"编码转换失败: {str(e)}")
            return str(text)
    
    def get_conversion_info(self, epub_path):
        """获取EPUB文件信息（不进行转换）"""
        try:
            logger.info(f"尝试读取EPUB文件: {epub_path}")
            book = epub.read_epub(epub_path)
            logger.info("EPUB文件读取成功")
            
            metadata = self._extract_metadata(book)
            logger.info(f"元数据提取完成: {metadata}")
            
            # 统计章节数量
            chapter_count = 0
            for item in book.get_items():
                # 兼容不同版本的ebooklib
                try:
                    if item.get_type() == epub.ITEM_DOCUMENT:
                        chapter_count += 1
                except AttributeError:
                    # 如果没有ITEM_DOCUMENT属性，使用其他方法判断
                    if hasattr(item, 'get_type') and 'document' in str(item.get_type()).lower():
                        chapter_count += 1
                    elif hasattr(item, 'file_name') and item.file_name.endswith('.xhtml'):
                        chapter_count += 1
            
            logger.info(f"章节数量: {chapter_count}")
            
            return {
                'success': True,
                'metadata': metadata,
                'chapter_count': chapter_count,
                'file_size': os.path.getsize(epub_path)
            }
            
        except Exception as e:
            logger.error(f"获取EPUB信息失败: {str(e)}")
            import traceback
            logger.error(f"详细错误信息: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e)
            } 