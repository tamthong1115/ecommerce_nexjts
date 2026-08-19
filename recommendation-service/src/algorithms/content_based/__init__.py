"""
Content-Based Filtering Algorithms

This package contains content-based recommendation algorithms that use
product attributes (text, categories, etc.) to compute similarity.
"""

from .tfidf import TFIDFRecommender

__all__ = ["TFIDFRecommender"]
