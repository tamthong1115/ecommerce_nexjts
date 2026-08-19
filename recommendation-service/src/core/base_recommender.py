from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


# Represents a single recommendation result.
class RecommendationResult(BaseModel):
    product_id: str
    score: float

# Abstract base class for all recommendation algorithms.
class BaseRecommender(ABC):
    """
    Method get name of this recommender, e.g. "CollaborativeFiltering", "ContentBased", etc.
    """
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    """
    Method get version of this recommender, e.g. "1.0.0", "2.1.3", etc.
    """
    @property
    @abstractmethod
    def version(self) -> str:
        pass

    """
    Method train the model with provided data. The implementation should handle the entire training pipeline, including:
        1. Load data from the data source
        2. Preprocess the data
        3. Train/fit the model
        4. Save the trained artifacts
    """
    @abstractmethod
    def train(self, **kwargs) -> None:
        pass

    """
    Generate recommendations for a given product.
    Args:
        product_id: The ID of the product to get recommendations for
        top_k: Maximum number of recommendations to return
    Returns:
        List of RecommendationResult objects sorted by score (descending)
    """
    @abstractmethod
    def predict(self, product_id: str, top_k: int = 12) -> List[RecommendationResult]:
        pass

    """
    Load pre-trained model artifacts from storage into memory.
    Returns:
        True if model loaded successfully, False otherwise
    """
    @abstractmethod
    def load_model(self) -> bool:
        pass

    """
    Persist model artifacts to storage.
    Returns:
        True if model saved successfully, False otherwise
    """
    @abstractmethod
    def save_model(self) -> bool:
        pass

    """
    Check if model is loaded and ready for inference.
    Returns:
        True if ready to serve predictions, False otherwise
    """

    @abstractmethod
    def is_ready(self) -> bool:
        pass
