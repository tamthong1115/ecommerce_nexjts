from .config import settings
from .database import engine, SessionLocal
# from .inferrence import recommender_engine
from .training import train_model
from src.data.data_loader import load_products_from_db
from src.data.preprocessing import prepare_data
from src.utils import _process_recommendation, _schedule_training, _run_training_task