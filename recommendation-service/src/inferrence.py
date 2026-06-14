# import pandas as pd
# import joblib
# import os
# from .config import settings
#
# class Recommender:
#     def __init__(self):
#         self.df = None
#         self.cosine_sim = None
#         self.indices = None
#         self.load_artifacts()
#
#     def load_artifacts(self):
#         """Load model và data từ ổ cứng vào RAM"""
#         if os.path.exists(settings.DATA_PATH) and os.path.exists(settings.MATRIX_PATH):
#             self.df = pd.read_csv(settings.DATA_PATH)
#             # Tạo map từ product_id -> index trong dataframe
#             self.indices = pd.Series(self.df.index, index=self.df['product_id']).drop_duplicates()
#             self.cosine_sim = joblib.load(settings.MATRIX_PATH)
#             print("✅ Model loaded successfully.")
#         else:
#             print("⚠️ Model not found. Please run training first.")
#
#     def get_recommendations(self, product_id: str, top_k: int = 5):
#         if self.df is None or self.cosine_sim is None:
#             return []
#
#         # Kiểm tra product_id có tồn tại không
#         if product_id not in self.indices:
#             return []
#
#         # Lấy index của sản phẩm
#         idx = self.indices[product_id]
#
#         # Lấy điểm tương đồng của sản phẩm này với tất cả sp khác
#         sim_scores = list(enumerate(self.cosine_sim[idx]))
#
#         # Sắp xếp giảm dần theo điểm tương đồng
#         sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
#
#         # Lấy top_k sản phẩm (bỏ qua phần tử đầu tiên là chính nó)
#         sim_scores = sim_scores[1:top_k + 1]
#
#         # Lấy index của các sp gợi ý
#         product_indices = [i[0] for i in sim_scores]
#
#         # Trả về danh sách product_id và title
#         return self.df.iloc[product_indices][['product_id', 'title', 'category_name', 'shop_name']].to_dict('records')
#
# # Khởi tạo singleton instance
# recommender_engine = Recommender()