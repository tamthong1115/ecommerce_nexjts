import pandas as pd
import re

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text


def prepare_data(df: pd.DataFrame) -> pd.DataFrame:
    df['content_soup'] = (
            df['title'].apply(clean_text) + " " +
            df['title'].apply(clean_text) + " " +
            df['category_name'].apply(clean_text) + " " +
            df['shop_name'].apply(clean_text) + " " +
            df['keywords'] + " " +
            df['description'].apply(clean_text)
    )

    return df