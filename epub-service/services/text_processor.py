import re
import logging

logger = logging.getLogger(__name__)

class TextProcessor:
    """文本处理工具类"""
    
    def __init__(self):
        # 定义需要清理的HTML实体
        self.html_entities = {
            '&nbsp;': ' ',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&ldquo;': '"',
            '&rdquo;': '"',
            '&lsquo;': "'",
            '&rsquo;': "'",
            '&hellip;': '...',
            '&mdash;': '—',
            '&ndash;': '–',
            '&times;': '×',
            '&divide;': '÷',
            '&copy;': '©',
            '&reg;': '®',
            '&trade;': '™'
        }
    
    def clean_text(self, text):
        """
        清理和格式化文本
        
        Args:
            text: 原始文本
            
        Returns:
            str: 清理后的文本
        """
        if not text:
            return ""
        
        try:
            # 1. 解码HTML实体
            text = self._decode_html_entities(text)
            
            # 2. 移除多余的空白字符
            text = self._normalize_whitespace(text)
            
            # 3. 清理特殊字符
            text = self._clean_special_chars(text)
            
            # 4. 格式化段落
            text = self._format_paragraphs(text)
            
            # 5. 移除空行
            text = self._remove_empty_lines(text)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"文本清理失败: {str(e)}")
            return text
    
    def _decode_html_entities(self, text):
        """解码HTML实体"""
        for entity, replacement in self.html_entities.items():
            text = text.replace(entity, replacement)
        
        # 处理数字HTML实体 (如 &#8217;)
        text = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), text)
        
        # 处理十六进制HTML实体 (如 &#x2019;)
        text = re.sub(r'&#x([0-9a-fA-F]+);', lambda m: chr(int(m.group(1), 16)), text)
        
        return text
    
    def _normalize_whitespace(self, text):
        """标准化空白字符"""
        # 将各种空白字符统一为空格
        text = re.sub(r'[\t\r\n\f\v]+', ' ', text)
        
        # 将多个连续空格合并为一个
        text = re.sub(r' +', ' ', text)
        
        return text
    
    def _clean_special_chars(self, text):
        """清理特殊字符"""
        # 移除控制字符（除了换行符）
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # 移除零宽字符
        text = re.sub(r'[\u200B-\u200D\uFEFF]', '', text)
        
        # 清理多余的标点符号
        text = re.sub(r'[。，、；：！？]{2,}', '。', text)
        text = re.sub(r'[.,;:!?]{2,}', '.', text)
        
        return text
    
    def _format_paragraphs(self, text):
        """格式化段落"""
        # 在句号、问号、感叹号后添加换行
        text = re.sub(r'([。！？])', r'\1\n', text)
        text = re.sub(r'([.!?])\s+', r'\1\n', text)
        
        # 在段落标记后添加换行
        text = re.sub(r'(\n\s*第[一二三四五六七八九十\d]+[章节])', r'\n\1', text)
        
        return text
    
    def _remove_empty_lines(self, text):
        """移除多余的空行"""
        # 将多个连续空行合并为一个
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        
        return text
    
    def extract_chapter_structure(self, text):
        """
        提取章节结构
        
        Args:
            text: 文本内容
            
        Returns:
            list: 章节结构列表
        """
        chapters = []
        
        try:
            # 匹配章节标题的模式
            patterns = [
                r'第[一二三四五六七八九十\d]+[章节]\s*[^\n]*',
                r'Chapter\s+\d+\s*[^\n]*',
                r'第[一二三四五六七八九十\d]+回\s*[^\n]*',
                r'^\s*[一二三四五六七八九十\d]+[、\s]+[^\n]*',
            ]
            
            lines = text.split('\n')
            current_chapter = None
            chapter_content = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # 检查是否是章节标题
                is_chapter_title = False
                for pattern in patterns:
                    if re.match(pattern, line):
                        # 保存前一章节
                        if current_chapter:
                            chapters.append({
                                'title': current_chapter,
                                'content': '\n'.join(chapter_content)
                            })
                        
                        # 开始新章节
                        current_chapter = line
                        chapter_content = []
                        is_chapter_title = True
                        break
                
                if not is_chapter_title and current_chapter:
                    chapter_content.append(line)
            
            # 保存最后一章
            if current_chapter:
                chapters.append({
                    'title': current_chapter,
                    'content': '\n'.join(chapter_content)
                })
            
        except Exception as e:
            logger.error(f"提取章节结构失败: {str(e)}")
        
        return chapters
    
    def count_words(self, text):
        """
        统计字数（中英文混合）
        
        Args:
            text: 文本内容
            
        Returns:
            dict: 统计结果
        """
        try:
            # 移除空白字符
            clean_text = re.sub(r'\s+', '', text)
            
            # 统计中文字符
            chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', clean_text))
            
            # 统计英文字符
            english_chars = len(re.findall(r'[a-zA-Z]', clean_text))
            
            # 统计数字
            digits = len(re.findall(r'\d', clean_text))
            
            # 统计标点符号
            punctuation = len(re.findall(r'[^\w\s\u4e00-\u9fff]', clean_text))
            
            return {
                'total_chars': len(clean_text),
                'chinese_chars': chinese_chars,
                'english_chars': english_chars,
                'digits': digits,
                'punctuation': punctuation,
                'lines': len(text.split('\n')),
                'paragraphs': len([p for p in text.split('\n\n') if p.strip()])
            }
            
        except Exception as e:
            logger.error(f"字数统计失败: {str(e)}")
            return {
                'total_chars': 0,
                'chinese_chars': 0,
                'english_chars': 0,
                'digits': 0,
                'punctuation': 0,
                'lines': 0,
                'paragraphs': 0
            }
    
    def detect_language(self, text):
        """
        检测文本语言
        
        Args:
            text: 文本内容
            
        Returns:
            str: 语言代码
        """
        try:
            # 统计中文字符比例
            chinese_ratio = len(re.findall(r'[\u4e00-\u9fff]', text)) / max(len(text), 1)
            
            if chinese_ratio > 0.3:
                return 'zh-CN'
            else:
                return 'en'
                
        except Exception as e:
            logger.error(f"语言检测失败: {str(e)}")
            return 'unknown' 