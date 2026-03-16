import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

from .config import settings
from src.data.data_loader import load_products_from_db
from src.data.preprocessing import prepare_data


def train_model():
    # 1. Load Data
    df = load_products_from_db()

    if df.empty:
        print("⚠️ No data to train.")
        return

    # 2. Preprocess
    df = prepare_data(df)

    # 3. Vectorize (TF-IDF)
    # stop_words='english' có thể thay bằng list tiếng Việt nếu cần
    tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_matrix = tfidf.fit_transform(df['content_soup'])

    # 4. Tính Cosine Similarity
    # linear_kernel nhanh hơn cosine_similarity cho ma trận lớn
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

    # 5. Lưu Artifacts
    os.makedirs(os.path.dirname(settings.DATA_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(settings.MODEL_PATH), exist_ok=True)

    # Lưu DataFrame đã xử lý (để map ID -> Index)
    df.to_csv(settings.DATA_PATH, index=False)

    # Lưu ma trận tương đồng (Model chính)
    joblib.dump(cosine_sim, settings.MATRIX_PATH)

    print("🎉 Training completed & Models saved!")


if __name__ == "__main__":
    train_model()