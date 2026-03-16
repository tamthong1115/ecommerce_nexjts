import os
from typing import List

import joblib
from sklearn.metrics.pairwise import cosine_similarity

from src import settings
from src.core import BaseRecommender, RecommendationResult
import pandas as pd

from src.data.data_loader import load_user_interactions_from_db


class CollaborativeFiltering(BaseRecommender):

    def __init__(self):
        self.collaborative_products: pd.DataFrame | None = None
        self._is_ready = False

    @property
    def name(self) -> str:
        return "collaborative_filtering"

    @property
    def version(self) -> str:
        return "1.0.0"

    def train(self, **kwargs) -> None:
        sparse_matrix, product_ids = load_user_interactions_from_db()
        if sparse_matrix is None or product_ids is None:
            print("⚠️ No data to train collaborative filtering model.")
            return

        item_item_similarity = cosine_similarity(sparse_matrix)

        self.collaborative_products = pd.DataFrame(
            item_item_similarity,
            index=product_ids,
            columns=product_ids
        )

        self._is_ready = True
        self.save_model()

        print("🎉 Item-Based CF model training completed!")

    def predict(self, product_id: str, top_k: int = 20) -> List[RecommendationResult]:
        df_sim = self.collaborative_products

        if not self._is_ready or df_sim is None:
            return []

        target_id = str(product_id)

        if target_id not in df_sim.index:
            return []

        sim_scores = df_sim.loc[target_id]

        top_items = sim_scores.drop(target_id).sort_values(ascending=False).head(top_k)

        results = []
        for pid, score in top_items.items():
            if score > 0:
                results.append(RecommendationResult(
                    product_id=str(pid),
                    score=float(score)
                ))

        return results

    def load_model(self) -> bool:
        try:
            model_path = settings.get_model_path(self.name)
            if os.path.exists(model_path):
                self.collaborative_products = joblib.load(model_path)
                self._is_ready = True
                print(" ---------- Item-Based CF model loaded successfully. ----------")
                return True
            else:
                print(" ---------- Item-Based CF model not found. Please run training first. ----------")
        except Exception as e:
            print(f" ---------- Failed to load Item-Based CF model: {e} ----------")

        self._is_ready = False
        return False

    def save_model(self) -> bool:
        if self.collaborative_products is None:
            return False
        try:
            model_path = settings.get_model_path(self.name)
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            joblib.dump(self.collaborative_products, model_path)
            print(" ---------- Item-Based CF model saved to disk. ----------")
            return True
        except Exception as e:
            print(f" ---------- Failed to save Item-Based CF model: {e} ----------")
            return False

    def is_ready(self) -> bool:
        return self._is_ready

