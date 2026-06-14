from fastapi import APIRouter
from src.api.schemas import HealthResponse, AlgorithmsListResponse, AlgorithmInfo
from src.core.registry import registry

router = APIRouter(prefix="/health", tags=["Health"])

# Health check endpoint.
@router.get("/", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        service="Recommender System",
        algorithms=registry.list_algorithms()
    )

# Endpoint to list all registered algorithms with their status.
@router.get("/algorithms", response_model=AlgorithmsListResponse)
def list_algorithms():
    algorithms = []
    for name, algo in registry.get_all().items():
        algorithms.append(AlgorithmInfo(
            name=algo.name,
            version=algo.version,
            is_ready=algo.is_ready()
        ))
    return AlgorithmsListResponse(algorithms=algorithms)
