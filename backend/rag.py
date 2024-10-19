import numpy as np
import pandas as pd

#Login to Hugging Face. It is mandatory to use the Gemma Model,
#and recommended to acces public models and Datasets.
from getpass import getpass
if 'hf_key' not in locals():
  hf_key = getpass("Your Hugging Face API Key: ")
!huggingface-cli login --token $hf_key

from datasets import load_dataset

data = load_dataset("keivalya/MedQuad-MedicalQnADataset", split="train")

data = data.to_pandas()
data["id"] = data.index
data.head(10)

MAX_ROWS = 15000
DOCUMENT = "Answer"
TOPIC = "qtype"

# Because it is just a sample we select a small portion of News.
subset_data = data.head(MAX_ROWS)

import chromadb

chroma_client = chromadb.PersistentClient(path="/path/to/persist/directory")

collection_name = "news_collection"
if len(chroma_client.list_collections()) > 0 and collection_name in [chroma_client.list_collections()[0].name]:
    chroma_client.delete_collection(name=collection_name)

collection = chroma_client.create_collection(name=collection_name)

collection.add(
    documents=subset_data[DOCUMENT].tolist(),
    metadatas=[{TOPIC: topic} for topic in subset_data[TOPIC].tolist()],
    ids=[f"id{x}" for x in range(MAX_ROWS)],
)