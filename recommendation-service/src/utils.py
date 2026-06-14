from typing import Optional

from fastapi import HTTPException, BackgroundTasks

from src.api.schemas import RecommendationResponse, ProductRecommendation, TrainingResponse
from src.core import registry


def _process_recommendation(product_id: Optional[str], algo_name: str) -> RecommendationResponse:
    algo = registry.get(algo_name)

    if not algo:
        raise HTTPException(
            status_code=404,
            detail=f"Algorithm '{algo_name}' not found. Available: {registry.list_algorithms()}"
        )

    if not algo.is_ready():
        raise HTTPException(
            status_code=503,
            detail=f"Algorithm '{algo_name}' not ready. Please run training first."
        )

    results = algo.predict(product_id)

    recommendations = [
        ProductRecommendation(product_id=r.product_id, score=r.score)
        for r in results
    ]

    return RecommendationResponse(
        product_id=product_id,
        algorithm=algo_name,
        recommendations=recommendations
    )


# --- 1. Background Worker (Hàm thực thi train chạy ngầm) ---
def _run_training_task(algo_name: str) -> None:
    algo = registry.get(algo_name)
    if algo:
        print(f"Starting training for {algo_name}...")
        try:
            algo.train()
            algo.load_model()
            print(f"Training completed for {algo_name}")
        except Exception as e:
            print(f"Training failed for {algo_name}: {e}")


# --- 2. Hàm Helper dùng chung cho các API ---
def _schedule_training(algo_name: str, background_tasks: BackgroundTasks) -> TrainingResponse:
    algo = registry.get(algo_name)

    if not algo:
        raise HTTPException(
            status_code=404,
            detail=f"Algorithm '{algo_name}' not found. Available: {registry.list_algorithms()}"
        )

    background_tasks.add_task(_run_training_task, algo_name)
    return TrainingResponse(
        message=f"Training started in background for {algo_name}",
        algorithm=algo_name
    )