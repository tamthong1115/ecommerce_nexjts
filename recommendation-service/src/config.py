import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    BASE_DATA_PROCESS: str = os.path.join("data", "processed")
    BASE_DATA_RAW: str = os.path.join("data", "raw")
    BASE_MODEL_DIR: str = os.path.join("models")

    class Config:
        env_file = ".env"

    def get_data_process_path(self, dataset_name: str = "products") -> str:
        return os.path.join(self.BASE_DATA_PROCESS, f"{dataset_name}.csv")

    def get_data_raw_path(self, dataset_name: str = "products_raw") -> str:
        return os.path.join(self.BASE_DATA_RAW, f"{dataset_name}.csv")

    def get_model_path(self, algo_name: str) -> str:
        return os.path.join(self.BASE_MODEL_DIR, f"{algo_name}.pkl")

    def get_matrix_path(self, algo_name: str) -> str:
        return os.path.join(self.BASE_MODEL_DIR, f"{algo_name}_matrix.pkl")


settings = Settings()
