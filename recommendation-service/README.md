recsys_project/
│
├── .env                    # Biến môi trường (DB_URL, API_KEY) - KHÔNG push lên git
├── .gitignore              # Config git ignore (bỏ qua .venv, data, __pycache__)
├── README.md               # Hướng dẫn cài đặt và chạy
├── requirements.txt        # Danh sách thư viện (hoặc pyproject.toml nếu dùng Poetry)
├── Dockerfile              # Config build Docker (nếu deploy)
│
├── data/                   # Nơi chứa dữ liệu (thường ignore git)
│   ├── raw/                # Dữ liệu thô (file csv export từ DB ở bước trước)
│   └── processed/          # Dữ liệu đã làm sạch/tokenized sẵn sàng train
│
├── models/                 # Nơi lưu file model đã train (.pkl, .h5, .pt)
│   └── recsys_v1.pkl
│
├── notebooks/              # Jupyter Notebooks để phân tích, thử nghiệm (EDA)
│   ├── 01_data_analysis.ipynb
│   └── 02_model_experiment.ipynb
│
├── src/                    # SOURCE CODE CHÍNH CỦA DỰ ÁN
│   └── ecommerce_recsys/   # Tên package (thường đặt theo tên dự án)
│       ├── __init__.py     # Đánh dấu thư mục là Python Package
│       ├── config.py       # Load cấu hình (class Settings, load .env)
│       ├── database.py     # Code kết nối DB (SQLAlchemy engine)
│       ├── preprocessing.py # Logic làm sạch data (tokenization, vectorization)
│       ├── training.py     # Script training model
│       ├── inference.py    # Logic dự đoán/gợi ý (để gọi từ API)
│       └── utils.py        # Các hàm tiện ích nhỏ lẻ
│
├── tests/                  # Unit tests
│   ├── __init__.py
│   └── test_preprocessing.py
│
└── main.py                 # Entry point (ví dụ: chạy API server hoặc chạy job training)