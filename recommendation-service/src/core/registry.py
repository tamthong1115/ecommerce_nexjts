from typing import Dict, Optional, List
from src.core.base_recommender import BaseRecommender

"""
    Central registry for recommendation algorithms.

    Implements Singleton pattern - only one instance exists at runtime.
    Use this registry to register algorithms at startup and retrieve
    them by name when handling API requests.

    Example:
        >>> from src.core.registry import registry
        >>> from src.algorithms.content_based.tfidf import TFIDFRecommender
        >>> 
        >>> tfidf = TFIDFRecommender()
        >>> registry.register(tfidf)
        >>> 
        >>> algo = registry.get("tfidf")
        >>> algo.predict("product-123", top_k=5)
"""
class AlgorithmRegistry:
    # Singleton class to manage registered recommendation algorithms.
    _instance: Optional["AlgorithmRegistry"] = None

    # Internal storage for algorithms: name -> instance
    _algorithms: Dict[str, BaseRecommender]

    # Singleton implementation
    def __new__(cls) -> "AlgorithmRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._algorithms = {}
        return cls._instance

    # Register an algorithm instance. If an algorithm with the same name exists, it will be replaced.
    def register(self, algorithm: BaseRecommender) -> None:
        if algorithm.name in self._algorithms:
            print(f"⚠️ Algorithm '{algorithm.name}' already registered, replacing...")
        
        self._algorithms[algorithm.name] = algorithm
        print(f"✅ Registered algorithm: {algorithm.name} v{algorithm.version}")


    # Unregister an algorithm by name. Returns True if successfully unregistered, False if not found.
    def unregister(self, name: str) -> bool:
        if name in self._algorithms:
            del self._algorithms[name]
            return True
        return False


    # Retrieve an algorithm instance by name. Returns None if not found.
    def get(self, name: str) -> Optional[BaseRecommender]:
        return self._algorithms.get(name)


    # List all registered algorithm names.
    def list_algorithms(self) -> List[str]:
        return list(self._algorithms.keys())


    # Get a copy of all registered algorithms (name -> instance).
    def get_all(self) -> Dict[str, BaseRecommender]:
        return self._algorithms.copy()


    # Clear all registered algorithms from the registry.
    def clear(self) -> None:
        self._algorithms.clear()


# Global registry instance
registry = AlgorithmRegistry()
