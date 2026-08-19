from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


# ============== Enums ==============

# Enum for supported recommendation algorithms. This can be extended as new algorithms are added to the system.
class AlgorithmType(str, Enum):
    TFIDF = "tfidf"
    POPULARITY = "popularity"


# ============== Request Schemas ==============

#DTO for request
# These schemas define the expected structure of request bodies and responses for the API endpoints.
class RecommendationRequest(BaseModel):
    """Request body for getting recommendations."""
    product_id: str = Field(..., description="Product ID to get recommendations for")
    limit: int = Field(default=12, ge=1, le=50, description="Number of recommendations")
    algorithm: Optional[AlgorithmType] = Field(
        default=None, 
        description="Algorithm to use (defaults to tfidf)"
    )


class TrainingRequest(BaseModel):
    """Request body for triggering model training."""
    algorithm: Optional[AlgorithmType] = Field(
        default=None,
        description="Specific algorithm to train (trains all if not specified)"
    )
    force: bool = Field(
        default=False,
        description="Force retrain even if model exists"
    )


# ============== Response Schemas ==============

# DTO for response
class ProductRecommendation(BaseModel):
    """Single product recommendation."""
    product_id: str
    score: Optional[float] = None


class RecommendationResponse(BaseModel):
    """Response for recommendation requests."""
    product_id: Optional[str] = None
    algorithm: str
    recommendations: List[ProductRecommendation]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    algorithms: List[str]


class TrainingResponse(BaseModel):
    """Response for training requests."""
    message: str
    algorithm: Optional[str] = None


class AlgorithmInfo(BaseModel):
    """Information about a registered algorithm."""
    name: str
    version: str
    is_ready: bool


class AlgorithmsListResponse(BaseModel):
    """Response listing all registered algorithms."""
    algorithms: List[AlgorithmInfo]


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
