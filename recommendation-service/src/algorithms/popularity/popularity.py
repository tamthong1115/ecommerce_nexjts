import os
import pandas as pd
import joblib
from typing import List, Optional

from src import settings
from src.core.base_recommender import BaseRecommender, RecommendationResult
from src.data import load_popularity_product_from_db


class PopularityRecommender(BaseRecommender):
    
    def __init__(self):
        self.popular_products: pd.DataFrame | None = None
        self._is_ready: bool = False
    
    @property
    def name(self) -> str:
        return "popularity"
    
    @property
    def version(self) -> str:
        return "1.0.0"
    
    def train(self, **kwargs) -> None:
        df = load_popularity_product_from_db()
        
        if df.empty:
            print("⚠️ No data to train popularity model.")
            return
        
        self.popular_products = df[['product_id', "popularity_score"]].copy()
        self._is_ready = True
        self.save_model()

        print("🎉 Popularity model training completed!")
    
    def predict(self, target_id: Optional[str] = None, top_k: int = 20) -> List[RecommendationResult]:
        df_popular = self.popular_products

        if not self._is_ready or df_popular is None:
            return []

        filtered = df_popular

        # Exclude the input product
        if target_id:
            filtered = filtered[filtered['product_id'].astype(str) != str(target_id)]

        filtered = filtered.head(top_k)

        results = [
            RecommendationResult(
                product_id=str(row['product_id']),
                score=float(row['popularity_score']),
            )
            for _, row in filtered.iterrows()
        ]
        
        return results
    
    def load_model(self) -> bool:
        """Load pre-trained model from disk."""
        try:
            if os.path.exists(settings.get_model_path("popularity")):
                self.popular_products = joblib.load(settings.get_model_path("popularity"))
                self._is_ready = True
                print(" ---------- Popularity model loaded successfully. ----------")
                return True
            else:
                print(" ---------- Popularity model not found. Please run training first. ----------")
        except Exception as e:
            print(f" ---------- Failed to load popularity model: {e} ----------")
        
        self._is_ready = False
        return False
    
    def save_model(self) -> bool:
        if self.popular_products is None:
            return False
        try:
            os.makedirs(os.path.dirname(settings.get_model_path("popularity")), exist_ok=True)
            joblib.dump(self.popular_products, settings.get_model_path("popularity"))
            print(" ---------- Popularity model saved to disk. ----------")
            return True
        except Exception as e:
            print(f" ---------- Failed to save popularity model: {e} ----------")
            return False
    
    def is_ready(self) -> bool:
        return self._is_ready
