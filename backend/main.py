import os
import pickle
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import chromadb
import numpy as np
from scipy.spatial.distance import cosine
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi import FastAPI
from fastapi.responses import FileResponse
import requests
from PIL import Image
from io import BytesIO
import ast
from tavily import TavilyClient
from rag import (
    tavily_search,
    get_content_from_tavily_search,
    get_links_from_tavily_search,
    agent_call,
)
from dotenv import load_dotenv

from pinata_connect import PinataClient

load_dotenv()


app = FastAPI()

pinata_client = PinataClient()

class SemanticCache:
    def __init__(
        self,
        model,
        cache_file="semantic_cache.pkl",
        cache_size=100,
        similarity_threshold=0.9,
    ):
        self.model = model
        self.cache_file = cache_file
        self.cache_size = cache_size
        self.similarity_threshold = similarity_threshold
        self.cache = self.load_cache()

    def load_cache(self):
        if os.path.exists(self.cache_file):
            print(f"Loading cache from {self.cache_file}")
            with open(self.cache_file, "rb") as f:
                return pickle.load(f)
        print("No existing cache found. Creating a new cache.")
        return {}

    def save_cache(self):
        print(f"Saving cache to {self.cache_file}")
        with open(self.cache_file, "wb") as f:
            pickle.dump(self.cache, f)

    def get(self, query):
        query_embedding = self.model.encode([query])[0]
        for cached_query, (cached_embedding, cached_result) in self.cache.items():
            similarity = 1 - cosine(query_embedding, cached_embedding)
            if similarity > self.similarity_threshold:
                print(f"Cache hit for query: '{query}' (similar to '{cached_query}')")
                return cached_result
        return None

    def add(self, query, result):
        if len(self.cache) >= self.cache_size:
            self.cache.pop(next(iter(self.cache)))
        query_embedding = self.model.encode([query])[0]
        self.cache[query] = (query_embedding, result)
        print(f"Added to cache: '{query}'")
        self.save_cache()


class TextItem(BaseModel):
    text: str
    metadata: dict


class QueryItem(BaseModel):
    query: str
    n_results: int = 2
    use_cache: bool = True
    store_in_pinata: Optional[bool] = False


model = SentenceTransformer("Snowflake/snowflake-arctic-embed-xs")
client = chromadb.Client()
collection_name = "fastapi_vector_db"
cache = SemanticCache(model)


@app.on_event("startup")
async def startup_event():
    global collection
    try:
        collection = client.create_collection(collection_name)
        upload_json(collection)
    except:
        collection = client.get_collection(collection_name)


@app.post("/add_texts/")
async def add_texts(texts: List[TextItem], store_in_pinata: Optional[bool] = False):
    documents = [item.text for item in texts]
    metadata = [item.metadata for item in texts]
    embeddings = model.encode(documents).tolist()

    collection.add(
        ids=[
            str(i)
            for i in range(collection.count(), collection.count() + len(documents))
        ],
        documents=documents,
        metadatas=metadata,
        embeddings=embeddings,
    )
    if store_in_pinata:
        try:
            json_data = {
                "documents": documents,
                "metadata": metadata,
                "embeddings": embeddings
            }
            response = pinata_client.upload_json(json_data)
            if response:
                return {
                    "message": f"Added {len(documents)} documents to the collection and stored in Pinata.",
                    "pinata_ipfs_hash": response.get("IpfsHash"),
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to Pinata: {str(e)}")
    return {"message": f"Added {len(documents)} documents to the collection."}


@app.post("/query/")
async def perform_query(query_item: QueryItem):
    if query_item.use_cache:
        cached_result = cache.get(query_item.query)
        if cached_result is not None:
            return {"result": cached_result, "source": "cache"}

    results = collection.query(
        query_texts=[query_item.query], n_results=query_item.n_results
    )
    if query_item.store_in_pinata:
        try:
            json_data = {
                "query": query_item.query,
                "result": results
            }
            response = pinata_client.upload_json(json_data)
            if response:
                return {
                    "result": results,
                    "source": "database",
                    "pinata_ipfs_hash": response.get("IpfsHash"),
                }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to Pinata: {str(e)}")
    if query_item.use_cache:
        cache.add(query_item.query, results)

    return {"result": results, "source": "database"}


@app.get("/collection_info/")
async def get_collection_info():
    return {"collection_name": collection_name, "document_count": collection.count()}


# Pydantic model for markdown output
class MarkdownResponse(BaseModel):
    query: str
    markdown_text: str
    reference_links: list[str]
    pinata_ipfs_hash: Optional[str] = None


create_query_prompt = "You are a helpful assistant that generates a single search query to find useful information related to the CONTENT for a brainstorming session about CONTENT . Generate ONLY the search query after the next [END], with a maximum of 250 words."
create_query_prompt_message = [{"role": "system", "content": create_query_prompt}]

sys_prompt = """You are a helpful assistant generates summaries based on the SEARCH CONTEXT from a search query below and the user CONTENT for a brainstorming session. Generate only the desired MARKDOWN after the next [END],  with a maximum of 250 words."""
sys_message = [{"role": "system", "content": sys_prompt}]


# Route for markdown text generation
@app.get("/get-markdown", response_model=MarkdownResponse)
async def get_markdown(input_text: str, store_in_pinata: Optional[bool] = False):
    query = agent_call(
        create_query_prompt_message, input_text, "CONTENT: " + input_text
    )
    # Simulate markdown text generation from the input text
    response = tavily_search(query)
    content = get_content_from_tavily_search(response, input_text)
    markdown_text = (
        agent_call(sys_message, "CONTEXT: " + input_text, "SEARCH_CONTEXT: " + content)
        .replace("```python", "")
        .replace("```", "")
    )
    pinata_ipfs_hash = None
    if store_in_pinata:
        try:
            json_data = {
                "query": query,
                "markdown_text": markdown_text,
                "reference_links": get_links_from_tavily_search(response),
            }
            pinata_response = pinata_client.upload_json(json_data)
            if pinata_response:
                pinata_ipfs_hash = pinata_response.get("IpfsHash")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to Pinata: {str(e)}")
    return MarkdownResponse(
        query=query,
        markdown_text=markdown_text,
        reference_links=get_links_from_tavily_search(response),
    )
    
@app.get("/retrieve-markdown-from-pinata/{ipfs_hash}", response_model=MarkdownResponse)
async def retrieve_markdown_from_pinata(ipfs_hash: str):
    try:
        data = pinata_client.retrieve_json(ipfs_hash)
        if data:
            content = data.get("content", {})
            return MarkdownResponse(
                query=content.get("query", ""),
                markdown_text=content.get("markdown_text", ""),
                reference_links=content.get("reference_links", []),
                pinata_ipfs_hash=ipfs_hash,
            )
        raise HTTPException(status_code=404, detail="Data not found on Pinata.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve from Pinata: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
