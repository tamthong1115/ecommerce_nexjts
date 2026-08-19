from fastapi import APIRouter, BackgroundTasks, HTTPException

from src import _run_training_task, _schedule_training
from src.api.schemas import TrainingResponse
from src.core.registry import registry

router = APIRouter(prefix="/v1/train", tags=["Training"])

# --- CÁC API ENDPOINTS CHÍNH ---

"""Kích hoạt train cho TẤT CẢ các thuật toán cùng lúc."""
@router.post("/all", response_model=TrainingResponse)
def train_all_algorithms(background_tasks: BackgroundTasks):
    algorithms = registry.list_algorithms()
    for name in algorithms:
        background_tasks.add_task(_run_training_task, name)
    
    return TrainingResponse(
        message=f"Training started for all algorithms: {algorithms}"
    )


"""Kích hoạt train cho thuật toán TF-IDF."""
@router.post("/tfidf", response_model=TrainingResponse)
def train_tfidf(background_tasks: BackgroundTasks):
    return _schedule_training("tfidf", background_tasks)


"""Kích hoạt train cho thuật toán Item-Based CF."""
@router.post("/collaborative-filtering", response_model=TrainingResponse)
def train_collaborative_filtering(background_tasks: BackgroundTasks):
    return _schedule_training("collaborative_filtering", background_tasks)


"""Kích hoạt train cho thuật toán FP-Growth (Mua cùng nhau)."""
@router.post("/fp-growth", response_model=TrainingResponse)
def train_fp_growth(background_tasks: BackgroundTasks):
    return _schedule_training("fp_growth", background_tasks)


"""Kích hoạt train cho thuật toán Popularity (Top bán chạy)."""
@router.post("/popularity", response_model=TrainingResponse)
def train_popularity(background_tasks: BackgroundTasks):
    return _schedule_training("popularity", background_tasks)