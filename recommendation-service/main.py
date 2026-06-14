from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.algorithms import FpGrowth
from src.api.routers import health, recommendations, training
from src.core.registry import registry

from src.algorithms.content_based.tfidf import TFIDFRecommender
from src.algorithms.popularity.popularity import PopularityRecommender
from src.algorithms.collaborative.collaborative import CollaborativeFiltering


# ============== 1. Algorithm Registration ==============
def initialize_algorithms():
    """Register and load all recommendation algorithms."""

    # Create algorithm instances
    tfidf_recommender = TFIDFRecommender()
    popularity_recommender = PopularityRecommender()
    cf_recommender = CollaborativeFiltering()
    fpg_recommender = FpGrowth()

    # Register with the global registry
    registry.register(tfidf_recommender)
    registry.register(popularity_recommender)
    registry.register(cf_recommender)
    registry.register(fpg_recommender)

    # Try to load pre-trained models
    print("📦 Loading pre-trained models...")
    tfidf_recommender.load_model()
    popularity_recommender.load_model()
    cf_recommender.load_model()
    fpg_recommender.load_model()


# ============== 2. Startup/Shutdown Events ==============
# Phải định nghĩa lifespan ở ĐÂY (trước khi tạo app)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Recommender System API starting...")
    initialize_algorithms()
    print(f"📊 Registered algorithms: {registry.list_algorithms()}")
    print("✅ Server is ready to accept requests!")

    yield

    print("👋 Recommender System API shutting down...")


# ============== 3. Create FastAPI application ==============
# Đem cục tạo app xuống đây, và NHỚ THÊM `lifespan=lifespan`
app = FastAPI(
    title="E-commerce Recommender System",
    description="Multi-algorithm product recommendation service",
    version="2.0.0",
    lifespan=lifespan  # <--- DÒNG NÀY LÀ CHÌA KHÓA GIẢI QUYẾT LỖI
)


# ============== 4. CORS Setup ==============
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== 5. Router Registration ==============
app.include_router(health.router)
app.include_router(recommendations.router)
app.include_router(training.router)