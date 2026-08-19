from typing import Optional

from fastapi import APIRouter, Query

from src import _process_recommendation
from src.api.schemas import (
    RecommendationResponse, 
)

router = APIRouter(prefix="/v1/recommend", tags=["Recommendations"])

"""Gợi ý các sản phẩm có nội dung, danh mục, mô tả tương tự."""
@router.get("/{product_id}/similar", response_model=RecommendationResponse)
def get_similar_products(
    product_id: str,
):
    return _process_recommendation(product_id, "tfidf")


"""Gợi ý dựa trên hành vi mua sắm của những người dùng khác."""
@router.get("/{product_id}/also-liked", response_model=RecommendationResponse)
def get_also_liked_products(
    product_id: str,
):
    return _process_recommendation(product_id, "collaborative_filtering")


"""Gợi ý các sản phẩm thường xuyên xuất hiện cùng nhau trong một đơn hàng."""
@router.get("/{product_id}/bought-together", response_model=RecommendationResponse)
def get_frequently_bought_together(
    product_id: str,
):
    return _process_recommendation(product_id, "fp_growth")

"""Gợi ý các sản phẩm phổ biến nhất (dựa trên lượt mua/lượt xem toàn hệ thống)."""
@router.get("/trending", response_model=RecommendationResponse)
def get_trending_products(
        product_id: Optional[str] = Query(None, description="Current product ID to exclude from trending list")
):
    return _process_recommendation(product_id, "popularity")