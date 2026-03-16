"""
Algorithms Package

Contains all recommendation algorithm implementations organized by type.

Subpackages:
- content_based: Content-based filtering (TF-IDF, Popularity)
- collaborative: Collaborative filtering (future)
- hybrid: Hybrid approaches (future)
- session_based: Session-based recommendations (future)
"""

from .collaborative import CollaborativeFiltering
from .content_based import TFIDFRecommender
from .fp_growth import FpGrowth
from .popularity import PopularityRecommender


__all__ = ["TFIDFRecommender", "PopularityRecommender" , "CollaborativeFiltering", "FpGrowth"]
