from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def seed_problems():
    db = SessionLocal()
    
    # Ensure tables exist
    models.Base.metadata.create_all(bind=engine)

    if db.query(models.Problem).first():
        print("Database already seeded.")
        db.close()
        return

    problems = [
        # 基础阶段 (Basic) - 数组、链表、栈、队列 (10)
        {"title": "两数之和", "difficulty": "Easy", "tags": "Array,Hash Table", "stage": "基础", "url": "https://leetcode.cn/problems/two-sum/"},
        {"title": "有效的括号", "difficulty": "Easy", "tags": "Stack", "stage": "基础", "url": "https://leetcode.cn/problems/valid-parentheses/"},
        {"title": "合并两个有序链表", "difficulty": "Easy", "tags": "LinkedList", "stage": "基础", "url": "https://leetcode.cn/problems/merge-two-sorted-lists/"},
        {"title": "最大子数组和", "difficulty": "Medium", "tags": "Array,DP", "stage": "基础", "url": "https://leetcode.cn/problems/maximum-subarray/"},
        {"title": "移动零", "difficulty": "Easy", "tags": "Array", "stage": "基础", "url": "https://leetcode.cn/problems/move-zeroes/"},
        {"title": "反转链表", "difficulty": "Easy", "tags": "LinkedList", "stage": "基础", "url": "https://leetcode.cn/problems/reverse-linked-list/"},
        {"title": "环形链表", "difficulty": "Easy", "tags": "LinkedList", "stage": "基础", "url": "https://leetcode.cn/problems/linked-list-cycle/"},
        {"title": "最小栈", "difficulty": "Medium", "tags": "Stack", "stage": "基础", "url": "https://leetcode.cn/problems/min-stack/"},
        {"title": "相交链表", "difficulty": "Easy", "tags": "LinkedList", "stage": "基础", "url": "https://leetcode.cn/problems/intersection-of-two-linked-lists/"},
        {"title": "回文链表", "difficulty": "Easy", "tags": "LinkedList", "stage": "基础", "url": "https://leetcode.cn/problems/palindrome-linked-list/"},

        # 中阶阶段 (Intermediate) - 树、二分、DFS/BFS (15)
        {"title": "二叉树的中序遍历", "difficulty": "Easy", "tags": "Tree,DFS", "stage": "中阶", "url": "https://leetcode.cn/problems/binary-tree-inorder-traversal/"},
        {"title": "对称二叉树", "difficulty": "Easy", "tags": "Tree", "stage": "中阶", "url": "https://leetcode.cn/problems/symmetric-tree/"},
        {"title": "二叉树的最大深度", "difficulty": "Easy", "tags": "Tree,DFS", "stage": "中阶", "url": "https://leetcode.cn/problems/maximum-depth-of-binary-tree/"},
        {"title": "翻转二叉树", "difficulty": "Easy", "tags": "Tree", "stage": "中阶", "url": "https://leetcode.cn/problems/invert-binary-tree/"},
        {"title": "二叉树的层序遍历", "difficulty": "Medium", "tags": "Tree,BFS", "stage": "中阶", "url": "https://leetcode.cn/problems/binary-tree-level-order-traversal/"},
        {"title": "验证二叉搜索树", "difficulty": "Medium", "tags": "Tree,DFS", "stage": "中阶", "url": "https://leetcode.cn/problems/validate-binary-search-tree/"},
        {"title": "岛屿数量", "difficulty": "Medium", "tags": "Graph,DFS", "stage": "中阶", "url": "https://leetcode.cn/problems/number-of-islands/"},
        {"title": "搜索旋转排序数组", "difficulty": "Medium", "tags": "Binary Search", "stage": "中阶", "url": "https://leetcode.cn/problems/search-in-rotated-sorted-array/"},
        {"title": "在排序数组中查找元素的第一个和最后一个位置", "difficulty": "Medium", "tags": "Binary Search", "stage": "中阶", "url": "https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/"},
        {"title": "全排列", "difficulty": "Medium", "tags": "Backtracking", "stage": "中阶", "url": "https://leetcode.cn/problems/permutations/"},
        {"title": "子集", "difficulty": "Medium", "tags": "Backtracking", "stage": "中阶", "url": "https://leetcode.cn/problems/subsets/"},
        {"title": "单词搜索", "difficulty": "Medium", "tags": "Backtracking", "stage": "中阶", "url": "https://leetcode.cn/problems/word-search/"},
        {"title": "组合总和", "difficulty": "Medium", "tags": "Backtracking", "stage": "中阶", "url": "https://leetcode.cn/problems/combination-sum/"},
        {"title": "二叉树的最近公共祖先", "difficulty": "Medium", "tags": "Tree", "stage": "中阶", "url": "https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/"},
        {"title": "二叉树的直径", "difficulty": "Easy", "tags": "Tree", "stage": "中阶", "url": "https://leetcode.cn/problems/diameter-of-binary-tree/"},

        # 进阶阶段 (Advanced) - 动态规划、贪心 (10)
        {"title": "爬楼梯", "difficulty": "Easy", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/climbing-stairs/"},
        {"title": "买卖股票的最佳时机", "difficulty": "Easy", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/"},
        {"title": "最长递增子序列", "difficulty": "Medium", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/longest-increasing-subsequence/"},
        {"title": "零钱兑换", "difficulty": "Medium", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/coin-change/"},
        {"title": "最长公共子序列", "difficulty": "Medium", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/longest-common-subsequence/"},
        {"title": "打家劫舍", "difficulty": "Medium", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/house-robber/"},
        {"title": "跳跃游戏", "difficulty": "Medium", "tags": "Greedy", "stage": "进阶", "url": "https://leetcode.cn/problems/jump-game/"},
        {"title": "不同路径", "difficulty": "Medium", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/unique-paths/"},
        {"title": "编辑距离", "difficulty": "Hard", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/edit-distance/"},
        {"title": "乘积最大子数组", "difficulty": "Medium", "tags": "DP", "stage": "进阶", "url": "https://leetcode.cn/problems/maximum-product-subarray/"},

        # 专项阶段 (Specialized) - 图论、并查集、滑动窗口、位运算 (10)
        {"title": "无重复字符的最长子串", "difficulty": "Medium", "tags": "Sliding Window", "stage": "专项", "url": "https://leetcode.cn/problems/longest-substring-without-repeating-characters/"},
        {"title": "最小覆盖子串", "difficulty": "Hard", "tags": "Sliding Window", "stage": "专项", "url": "https://leetcode.cn/problems/minimum-window-substring/"},
        {"title": "课程表", "difficulty": "Medium", "tags": "Graph,Topological Sort", "stage": "专项", "url": "https://leetcode.cn/problems/course-schedule/"},
        {"title": "实现 Trie (前缀树)", "difficulty": "Medium", "tags": "Trie", "stage": "专项", "url": "https://leetcode.cn/problems/implement-trie-prefix-tree/"},
        {"title": "除法求值", "difficulty": "Medium", "tags": "Graph,Union Find", "stage": "专项", "url": "https://leetcode.cn/problems/evaluate-division/"},
        {"title": "只出现一次的数字", "difficulty": "Easy", "tags": "Bit Manipulation", "stage": "专项", "url": "https://leetcode.cn/problems/single-number/"},
        {"title": "多数元素", "difficulty": "Easy", "tags": "Bit Manipulation", "stage": "专项", "url": "https://leetcode.cn/problems/majority-element/"},
        {"title": "腐烂的橘子", "difficulty": "Medium", "tags": "BFS", "stage": "专项", "url": "https://leetcode.cn/problems/rotting-oranges/"},
        {"title": "滑动窗口最大值", "difficulty": "Hard", "tags": "Sliding Window", "stage": "专项", "url": "https://leetcode.cn/problems/sliding-window-maximum/"},
        {"title": "前 K 个高频元素", "difficulty": "Medium", "tags": "Heap", "stage": "专项", "url": "https://leetcode.cn/problems/top-k-frequent-elements/"},

        # 冲刺阶段 (Sprint) - 高频面试 Hard 题、设计题 (5)
        {"title": "LRU 缓存", "difficulty": "Medium", "tags": "Design", "stage": "冲刺", "url": "https://leetcode.cn/problems/lru-cache/"},
        {"title": "接雨水", "difficulty": "Hard", "tags": "Two Pointers", "stage": "冲刺", "url": "https://leetcode.cn/problems/trapping-rain-water/"},
        {"title": "合并 K 个升序链表", "difficulty": "Hard", "tags": "Heap", "stage": "冲刺", "url": "https://leetcode.cn/problems/merge-k-sorted-lists/"},
        {"title": "寻找两个正序数组的中位数", "difficulty": "Hard", "tags": "Binary Search", "stage": "冲刺", "url": "https://leetcode.cn/problems/median-of-two-sorted-arrays/"},
        {"title": "柱状图中最大的矩形", "difficulty": "Hard", "tags": "Stack", "stage": "冲刺", "url": "https://leetcode.cn/problems/largest-rectangle-in-histogram/"}
    ]

    for p in problems:
        db_problem = models.Problem(**p)
        db.add(db_problem)
    
    db.commit()
    db.close()
    print("Seeded 50 problems successfully.")

if __name__ == "__main__":
    seed_problems()
