import os
import json
import pandas as pd
import joblib
from typing import List

from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import linear_kernel

from src.core.base_recommender import BaseRecommender, RecommendationResult
from src.config import settings
from src.data.data_loader import load_products_from_db
from src.data.preprocessing import prepare_data

HERE = os.path.dirname(__file__)
stopword_path = os.path.abspath(os.path.join(HERE, '..', '..', 'public', 'stopwords-vi.json'))
try:
    with open(stopword_path, 'r', encoding='utf-8') as f:
        stopwords_vi = json.load(f)
except FileNotFoundError:
    print(f"⚠️ Warning: Stopwords file not found at {stopword_path}. Using empty list.")
    stopwords_vi = []

stopword = stopwords_vi + list(ENGLISH_STOP_WORDS)

class TFIDFRecommender(BaseRecommender):
    def __init__(self):
        self.df: pd.DataFrame | None = None
        self.cosine_sim = None
        self.indices: pd.Series | None = None
        self._is_ready: bool = False

    @property
    def name(self) -> str:
        return "tfidf"

    @property
    def version(self) -> str:
        return "1.0.0"

    def train(self, **kwargs) -> None:
        """Train the TF-IDF model."""

        # 1. Load Data
        df = load_products_from_db()

        if df.empty:
            print("⚠️ No data to train TF-IDF model.")
            return

        # 2. Preprocess
        df = prepare_data(df)
        df['product_id'] = df['product_id'].astype(str)

        # 3. Vectorize (TF-IDF)
        tfidf = TfidfVectorizer(stop_words=stopword, max_features=5000, min_df=2, max_df=0.8, ngram_range=(1, 2), )
        tfidf_matrix = tfidf.fit_transform(df['content_soup'])

        # 4. Compute Cosine Similarity
        # linear_kernel is faster than cosine_similarity for large matrices
        cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

        self.df = df
        self.cosine_sim = cosine_sim
        self.indices = pd.Series(self.df.index, index=self.df['product_id'])
        self.indices = self.indices[~self.indices.index.duplicated(keep='first')]
        self._is_ready = True
        self.save_model()
        print("🎉 TF-IDF training completed & models saved!")

    def predict(self, product_id: str, top_k: int = 5) -> List[RecommendationResult]:
        df_local = self.df
        indices_local = self.indices
        sim_local = self.cosine_sim

        if not self._is_ready or df_local is None or indices_local is None or sim_local is None:
            return []

        # Check if product exists
        if product_id not in self.indices.index:
            return []

        # Get index of the product
        idx = self.indices[product_id]

        # Get similarity scores for this product with all others
        sim_scores = list(enumerate(self.cosine_sim[idx]))

        # Sort by similarity (descending)
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        # Get top_k products (skip first one which is the product itself)
        sim_scores = sim_scores[1:top_k + 1]

        # Build results
        results = []
        for i, score in sim_scores:
            row = self.df.iloc[i]
            results.append(RecommendationResult(
                product_id=str(row['product_id']),
                score=float(score),
            ))

        return results

    def load_model(self) -> bool:
        """Load pre-trained model artifacts from disk."""
        try:
            if os.path.exists(settings.get_data_process_path("tfidf")) and os.path.exists(
                    settings.get_matrix_path("tfidf")):
                self.df = pd.read_csv(settings.get_data_process_path("tfidf"))

                # [QUAN TRỌNG] Ép kiểu lại thành chuỗi sau khi đọc từ CSV
                self.df['product_id'] = self.df['product_id'].astype(str)

                self.indices = pd.Series(self.df.index, index=self.df['product_id'])
                self.indices = self.indices[~self.indices.index.duplicated(keep='first')]

                self.cosine_sim = joblib.load(settings.get_matrix_path("tfidf"))
                self._is_ready = True
                print(" ------------ TF-IDF model loaded successfully. ------------ ")
                return True
            else:
                print(" ------------ TF-IDF model files not found. Please run training first. ------------")
        except Exception as e:
            print(f" ------------ Failed to load TF-IDF model: {e} ------------")

        self._is_ready = False
        return False

    def save_model(self) -> bool:
        if self.df is None or self.cosine_sim is None:
            return False

        try:
            os.makedirs(os.path.dirname(settings.get_data_process_path("tfidf")), exist_ok=True)
            os.makedirs(os.path.dirname(settings.get_matrix_path("tfidf")), exist_ok=True)

            self.df.to_csv(settings.get_data_process_path("tfidf"), index=False)
            joblib.dump(self.cosine_sim, settings.get_matrix_path("tfidf"))
            print(" ---------- TF-IDF model artifacts saved to disk. ----------")
            return True
        except Exception as e:
            print(f" ---------- Failed to save TF-IDF model: {e} ----------")
            return False

    def is_ready(self) -> bool:
        """Check if model is loaded and ready."""
        return self._is_ready
