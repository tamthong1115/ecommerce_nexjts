import pandas as pd
from src.database import engine
from scipy.sparse import csr_matrix


def load_products_from_db():
    query = """
    SELECT 
        p.id as product_id,
        p.title,
        COALESCE(p.description, '') as description,
        p.keywords,
        c.name as category_name,
        s.name as shop_name
    FROM product p
    LEFT JOIN category c ON p."categoryId" = c.id
    LEFT JOIN shop s ON p."shopId" = s.id
    WHERE p.status = 'PUBLISHED' 
      AND p.visibility = 'PUBLIC'
      AND p."deletedAt" IS NULL
    """

    df = pd.read_sql(query, engine)

    # Xử lý mảng keywords (Postgres Array -> String)
    # Nếu keywords là null, trả về chuỗi rỗng
    df['keywords'] = df['keywords'].apply(
        lambda x: ' '.join(x) if isinstance(x, list) else ''
    )

    # Điền khuyết
    df['category_name'] = df['category_name'].fillna('')
    df['shop_name'] = df['shop_name'].fillna('')

    print(f"✅ Loaded {len(df)} products.")
    return df


def load_popularity_product_from_db():
    query = """
    SELECT
        p.id as product_id,
        p."categoryId",
        p."ratingAvg",
        p."ratingCount",
        p."createdAt",
        SUM(pds.views) as views,
        SUM(pds.carts) as carts,
        SUM(pds.sales) as sales,
        SUM(pds.revenue) as revenue
    FROM product p
    LEFT JOIN product_daily_stat pds ON p.id = pds."productId" AND pds.date >= CURRENT_DATE - INTERVAL '7 days'
    WHERE p.status = 'PUBLISHED'
    GROUP BY 
        p.id, 
        p."categoryId", 
        p."ratingAvg", 
        p."ratingCount", 
        p."createdAt"
    """

    df = pd.read_sql(query, engine)

    # Fill NaN values with 0 for numeric columns (views, carts, sales, revenue, ratingAvg, ratingCount)
    col_to_fix = ['views', 'carts', 'sales', 'revenue', 'ratingAvg', 'ratingCount']
    df[col_to_fix] = df[col_to_fix].fillna(0)

    # Convert data types
    df['views'] = df['views'].astype(int)
    df['carts'] = df['carts'].astype(int)
    df['sales'] = df['sales'].astype(int)
    df['revenue'] = df['revenue'].astype(float)

    # Calculate popularity score (simple weighted sum)
    # Weights can be adjusted based on business needs
    df['popularity_score'] = (
            (df['views'] * 0.1) +
            (df['carts'] * 0.3) +
            (df['sales'] * 0.5) +
            (df['ratingAvg'] * df['ratingCount'] * 0.2)
    )
    # Sort by popularity score descending
    df = df.sort_values(by='popularity_score', ascending=False)
    return df


def load_user_interactions_from_db():
    query = """
    SELECT 
        ui."userId",
        ui."sessionId",
        ui."productId",
        ui."interactionType",
        ui.weight,
        ui."createdAt" as timestamp
    FROM user_interaction_log ui
    JOIN product p ON ui."productId" = p.id
    WHERE p.status = 'PUBLISHED' 
      AND p.visibility = 'PUBLIC'
      AND p."deletedAt" IS NULL
    """

    df = pd.read_sql(query, engine)

    df['user_identifier'] = df['userId'].fillna(df['sessionId'])
    df = df.dropna(subset=['user_identifier'])

    user_item_matrix = df.pivot_table(
        index='user_identifier',  # Row
        columns='productId',  # Column
        values='weight',  # Value
        aggfunc='sum',  # Aggregation function (sum weights for multiple interactions)
        fill_value=0
    )

    item_user_matrix = user_item_matrix.T

    product_ids = item_user_matrix.index.astype(str).tolist()

    sparse_item_user_matrix = csr_matrix(item_user_matrix.values)

    return sparse_item_user_matrix, product_ids


def load_item_order_from_db():
    query = """
    SELECT
    o.id as order_id,
    ARRAY_AGG(DISTINCT oi."productId") AS list_items
    FROM "order" o
    JOIN order_item oi ON o.id = oi."orderId"
    JOIN product p ON oi."productId" = p.id
    WHERE p.status = 'PUBLISHED'
        AND p.visibility = 'PUBLIC'
        AND p."deletedAt" IS NULL
        AND o.status = 'DELIVERED'
        AND o."placedAt" >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY o.id
    HAVING COUNT(DISTINCT oi."productId") > 1
    """

    df = pd.read_sql(query, engine)

    transactions = df['list_items'].apply(lambda x: list(map(str, x))).tolist()

    return transactions
