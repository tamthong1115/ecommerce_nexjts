import sys

from src.algorithms import FpGrowth
from src.core.registry import registry
from src.algorithms.content_based.tfidf import TFIDFRecommender
from src.algorithms.popularity.popularity import PopularityRecommender
from src.algorithms.collaborative.collaborative import CollaborativeFiltering


def setup_local_environment():
    """Khởi tạo và load model y hệt như lúc chạy server."""
    print("🚀 Đang khởi tạo hệ thống cục bộ...")

    # 1. Khởi tạo instance
    tfidf = TFIDFRecommender()
    pop = PopularityRecommender()
    cf = CollaborativeFiltering()
    fpg = FpGrowth()

    # 2. Đăng ký vào registry
    registry.register(tfidf)
    registry.register(pop)
    registry.register(cf)
    registry.register(fpg)

    # 3. Load pre-trained models từ file .pkl
    print("📦 Đang load models từ ổ cứng lên RAM...")
    tfidf.load_model()
    pop.load_model()
    cf.load_model()
    fpg.load_model()
    print("✅ Môi trường test đã sẵn sàng!\n")
    print("=" * 50)


def test_algorithm(algo_name: str, target_id: str = None, top_k: int = 5):
    """Hàm chạy thử một thuật toán cụ thể."""
    algo = registry.get(algo_name)

    if not algo:
        print(f"❌ Lỗi: Không tìm thấy thuật toán '{algo_name}'")
        return

    if not algo.is_ready():
        print(f"❌ Lỗi: Thuật toán '{algo_name}' chưa được train hoặc load lỗi!")
        return

    print(f"🔍 [TEST] Chạy thuật toán: {algo_name.upper()}")
    print(f"👉 Input Target ID: {target_id}")

    # Đoạn này để debug sâu xem model có chứa ID này không
    if target_id:
        try:
            # Check nhanh xem target_id có nằm trong index/keys của model không
            if algo_name == "collaborative_filtering" and target_id not in algo.collaborative_products.index:
                print(f"   ⚠️ CẢNH BÁO: ID '{target_id}' KHÔNG TỒN TẠI trong ma trận CF!")
            elif algo_name == "fp_growth" and target_id not in algo.recommendation_map:
                print(f"   ⚠️ CẢNH BÁO: ID '{target_id}' KHÔNG CÓ luật mua kèm nào trong FP-Growth!")
        except Exception:
            pass  # Bỏ qua nếu cấu trúc bên trong class của bạn khác

    # Chạy predict
    results = algo.predict(target_id)

    # In kết quả
    if not results:
        print("   🔴 Kết quả: [] (Rỗng - Thuật toán không tìm thấy gợi ý nào)")
    else:
        print(f"   🟢 Tìm thấy {len(results)} kết quả:")
        for i, res in enumerate(results, 1):
            print(f"      {i}. Product ID: {res.product_id} | Score: {res.score:.4f}")

    print("=" * 50)


if __name__ == "__main__":
    # 1. Cài đặt môi trường
    setup_local_environment()

    # 2. THAY BẰNG MỘT PRODUCT_ID CÓ THẬT TRONG DB CỦA BẠN ĐỂ TEST
    # Lưu ý: Chắc chắn rằng ID này đã từng được mua (nếu test fp_growth)
    # hoặc từng được tương tác (nếu test CF).
    TEST_PRODUCT_ID = "01229a45-4607-4b26-9555-b453742fc575"

    # 3. Chạy test lần lượt các thuật toán

    # Test Popularity (Không cần ID cũng được, test xem có ra top bán chạy không)
    test_algorithm("popularity", top_k=5)

    # Test FP-Growth
    # test_algorithm("fp_growth", TEST_PRODUCT_ID)

    # Test Item-Based CF
    test_algorithm("collaborative_filtering", TEST_PRODUCT_ID)

    # Test TF-IDF
    test_algorithm("tfidf", TEST_PRODUCT_ID)