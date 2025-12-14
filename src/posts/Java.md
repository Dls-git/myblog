---
title: Java 基础知识总结
date: 2024-12-15
category: 后端开发
tags:
  - Java
  - 基础
  - 面试
description: 深入浅出 Java 核心基础知识
updated: 2024-12-20
readingTime: 15
wordCount: 3500
---

## 1. Java 基础

### 1.1 JDK, JRE, JVM 区别

在 Java 中处理字符串时，`String` 类和 `StringBuilder`/`StringBuffer` 类提供了大量实用 API，以下是刷题时常用的核心方法分类整理：



### 一、`String` 类常用方法（不可变字符串）



1. **获取长度**`int length()`：返回字符串长度（注意与 `isEmpty()` 区分，`length() == 0` 等价于 `isEmpty()`）。  

    ```java
    
    ```

2. **获取字符/索引**  

    - `char charAt(int index)`：返回指定索引的字符（索引从 0 开始，越界抛 `StringIndexOutOfBoundsException`）。  

        ```Java
        
        ```

    - `int indexOf(String str)`：返回子串 `str` 首次出现的索引，未找到返回 `-1`（重载：支持从指定位置开始查找 `indexOf(str, fromIndex)`）。  

    - `int lastIndexOf(String str)`：返回子串 `str` 最后出现的索引，未找到返回 `-1`（重载：`lastIndexOf(str, fromIndex)`）。  

3. **截取子串**  

    - `String substring(int beginIndex)`：从 `beginIndex` 截取到末尾。  

    - `String substring(int beginIndex, int endIndex)`：截取 `[beginIndex, endIndex)` 区间的子串（左闭右开）。  

    ```Java
    
    ```

4. **字符串比较**  

    - `boolean equals(Object obj)`：判断内容是否相等（区分大小写，需与 `==` 区分，`==` 比较地址）。  

    - `boolean equalsIgnoreCase(String str)`：忽略大小写比较内容。  

    - `int compareTo(String str)`：按字典序比较，返回差值（正数：当前串大；0：相等；负数：当前串小）。  

5. **判断前缀/后缀**  

    - `boolean startsWith(String prefix)`：是否以 `prefix` 开头（重载：`startsWith(prefix, fromIndex)` 从指定位置开始判断）。  

    - `boolean endsWith(String suffix)`：是否以 `suffix` 结尾。  

6. **替换字符/子串**  

    - `String replace(char oldChar, char newChar)`：替换所有旧字符为新字符。  

    - `String replace(CharSequence target, CharSequence replacement)`：替换所有目标子串为新子串。  

    - `String replaceAll(String regex, String replacement)`：按正则表达式替换（注意转义，如 `.` 需写成 `\.`）。  

    - `String replaceFirst(String regex, String replacement)`：替换第一个匹配的正则子串。  

7. **分割字符串**`String[] split(String regex)`：按正则表达式分割字符串（重载：`split(regex, limit)` 限制分割次数）。  

    ```Java
    
    ```

8. **大小写转换**  

    - `String toLowerCase()`：转为小写。  

    - `String toUpperCase()`：转为大写。  

9. **去除首尾空白**`String trim()`：去除首尾空白字符（空格、换行、制表符等，JDK 11+ 可用 `strip()` 更彻底，支持 Unicode 空白）。  

10. **其他常用**  

    - `boolean contains(CharSequence s)`：是否包含子串 `s`。  

    - `String concat(String str)`：拼接字符串（等价于 `+`，但效率略高）。  

    - `static String valueOf(...)`：将其他类型（如 `int`、`char[]`）转为字符串（常用 `String.valueOf(123)` 替代 `123 + ""`）。  



### 二、`StringBuilder`/`StringBuffer` 类（可变字符串，适合频繁修改）



`StringBuilder` 线程不安全但效率高，`StringBuffer` 线程安全但效率低，刷题优先用 `StringBuilder`。



1. **构造方法**  

    ```Java
    
    ```

2. **添加内容**`append(...)`：追加任意类型数据（字符、字符串、数字等），返回自身（可链式调用）。  

    ```Java
    
    ```

3. **插入内容**`insert(int offset, ...)`：在指定索引插入数据，返回自身。  

    ```Java
    
    ```

4. **删除操作**  

    - `deleteCharAt(int index)`：删除指定索引的字符。  

    - `delete(int start, int end)`：删除 `[start, end)` 区间的字符。  

5. **替换与反转**  

    - `replace(int start, int end, String str)`：替换 `[start, end)` 区间为 `str`。  

    - `reverse()`：反转字符串（高频！如判断回文、反转单词等场景）。  

    ```Java
    
    ```

6. **转为字符串**`toString()`：将 `StringBuilder` 转为 `String` 类型。  



### 三、刷题高频场景示例



1. **判断回文**：结合 `charAt` 和双指针，或用 `StringBuilder.reverse()` 比较。  

2. **分割单词**：用 `split(" ")` 或手动遍历 `charAt` 判断空格。  

3. **拼接字符串**：频繁修改时用 `StringBuilder.append()` 避免 `String` 重复创建。  

4. **子串匹配**：用 `indexOf` 或 `startsWith` 快速判断。  



掌握这些 API 能大幅提升字符串处理效率，刷题时根据场景选择 `String`（只读）或 `StringBuilder`（修改）即可。
> （注：文档部分内容可能由 AI 生成）
