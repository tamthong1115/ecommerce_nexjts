import os
from typing import List

import joblib
from mlxtend.frequent_patterns import fpgrowth, association_rules
from mlxtend.preprocessing import TransactionEncoder

from src import settings
from src.core import BaseRecommender, RecommendationResult
import pandas as pd

from src.data.data_loader import load_item_order_from_db


class FpGrowth(BaseRecommender):

    def __init__(self, **kwargs):
        self.recommendation_map : dict | None = None
        self._is_ready = False

    @property
    def name(self) -> str:
        return "fp_growth"

    @property
    def version(self) -> str:
        return "1.0.0"

    def train(self, **kwargs) -> None:
        print("Training FP-Growth model...")

        list_items = load_item_order_from_db()

        if list_items is None or len(list_items) == 0:
            print("⚠️ No data to train FP-Growth model.")
            return

        te = TransactionEncoder()
        te_arr = te.fit_transform(list_items)
        df_encode = pd.DataFrame(te_arr, columns=te.columns_)

        frequent_itemsets = fpgrowth(df_encode, min_support=0.01, use_colnames=True)

        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5)

        recommendation_map = {}

        for index, row in rules.iterrows():
            antecedents = list(row['antecedents'])
            consequents = list(row['consequents'])
            confidence = float(row['confidence'])

            if len(antecedents) == 1 and len(consequents) == 1:
                antecedent = str(antecedents[0])
                consequent = str(consequents[0])

                if antecedent not in recommendation_map:
                    recommendation_map[antecedent] = []

                # Tránh trùng lặp sản phẩm gợi ý
                existing_items = [item[0] for item in recommendation_map[antecedent]]
                if consequent not in existing_items:
                    # Lưu cả product_id và score (confidence)
                    recommendation_map[antecedent].append((consequent, confidence))

        for key in recommendation_map:
            recommendation_map[key] = sorted(recommendation_map[key], key=lambda x: x[1], reverse=True)

        self.recommendation_map = recommendation_map
        self._is_ready = True
        self.save_model()

        print("🎉 FP-Growth model training completed!")

    def predict(self, product_id: str, top_k: int = 20) -> List[RecommendationResult]:
        if not self._is_ready or self.recommendation_map is None:
            return []

        target_id = str(product_id)

        if target_id not in self.recommendation_map:
            return []

        # Lấy top_k sản phẩm gợi ý
        top_items = self.recommendation_map[target_id][:top_k]

        results = []
        for pid, score in top_items:
            results.append(RecommendationResult(
                product_id=str(pid),
                score=float(score)  # Score ở đây chính là confidence của FP-Growth
            ))

        return results

    def load_model(self) -> bool:
        try:
            model_path = settings.get_model_path(self.name)
            if os.path.exists(model_path):
                self.recommendation_map = joblib.load(model_path)
                self._is_ready = True
                print(" ---------- FP-Growth model loaded successfully. ----------")
                return True
            else:
                print(" ---------- FP-Growth model not found. Please run training first. ----------")
        except Exception as e:
            print(f" ---------- Failed to load FP-Growth model: {e} ----------")

        self._is_ready = False
        return False

    def save_model(self) -> bool:
        if self.recommendation_map is None:
            return False
        try:
            model_path = settings.get_model_path(self.name)
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            joblib.dump(self.recommendation_map, model_path)
            print(" ---------- FP-Growth model saved to disk. ----------")
            return True
        except Exception as e:
            print(f" ---------- Failed to save FP-Growth model: {e} ----------")
            return False

    def is_ready(self) -> bool:
        return self._is_ready