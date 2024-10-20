from sentence_transformers import SentenceTransformer
import chromadb
import numpy as np
from scipy.spatial.distance import cosine
from tavily import TavilyClient
import requests
import os
import ast
from dotenv import load_dotenv

load_dotenv()


class SemanticCache:
    def __init__(self, model, cache_size=100, similarity_threshold=0.9):
        self.model = model
        self.cache = {}
        self.cache_size = cache_size
        self.similarity_threshold = similarity_threshold

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
            # Remove the oldest entry
            self.cache.pop(next(iter(self.cache)))
        query_embedding = self.model.encode([query])[0]
        self.cache[query] = (query_embedding, result)
        print(f"Added to cache: '{query}'")


def load_model(model_name="Snowflake/snowflake-arctic-embed-xs"):
    print("Loading model...")
    return SentenceTransformer(model_name)


def initialize_client():
    print("Initializing ChromaDB client...")
    return chromadb.Client()


def get_or_create_collection(client, collection_name, documents, metadata, model):
    try:
        print(f"Attempting to create collection: {collection_name}")
        collection = client.create_collection(collection_name)
        print("Collection created successfully.")

        print("Encoding documents...")
        embeddings = model.encode(documents).tolist()

        print("Adding documents to collection...")
        collection.add(
            ids=[str(i) for i in range(len(documents))],
            documents=documents,
            metadatas=metadata,
            embeddings=embeddings,
        )
        print(f"Added {len(documents)} documents to the collection.")
    except Exception as e:
        print(f"Error creating collection: {str(e)}")
        print("Attempting to retrieve existing collection...")
        try:
            collection = client.get_collection(collection_name)
            print(f"Retrieved existing collection: {collection_name}")
        except Exception as e:
            print(f"Error retrieving collection: {str(e)}")
            return None

    return collection


def perform_query(collection, query, cache, n_results=2):
    if collection is None:
        print("Cannot perform query: Collection is None")
        return None

    print(f"Performing query: '{query}'")

    # Check cache first
    cached_result = cache.get(query)
    if cached_result is not None:
        return cached_result

    # If not in cache, perform the query
    results = collection.query(query_texts=[query], n_results=n_results)

    # Add result to cache
    cache.add(query, results)

    return results


def process_context(results):
    if results is None:
        return "No results to process."

    context = ""
    for i, (doc, meta) in enumerate(
        zip(results["documents"][0], results["metadatas"][0])
    ):
        context += f"Context {i}: {meta.get('id', 'N/A')}, {doc}\n"
    return context


# if __name__ == "__main__":
#     try:
#         model = load_model()
#         client = initialize_client()
#         collection_name = "landscape_data_manual"

#         all_text = [
#             "potato",
#             "tomato",
#             "apple",
#             "chocolate",
#             "fridge",
#             "carrot",
#             "banana",
#             "cucumber",
#             "lettuce",
#             "onion",
#         ]
#         all_metadata = [{"id": f"id{i+1}"} for i in range(len(all_text))]

#         print("Collection and document details:")
#         print(f"Collection name: {collection_name}")
#         print(f"Documents: {all_text}")
#         print(f"Metadata: {all_metadata}")

#         collection = get_or_create_collection(
#             client, collection_name, all_text, all_metadata, model
#         )

#         if collection:
#             print(f"Collection '{collection_name}' details:")
#             print(f"Number of items: {collection.count()}")

#             # Initialize semantic cache
#             cache = SemanticCache(model)

#             # Perform multiple queries to demonstrate caching
#             queries = ["vegetable", "fruit", "veggie", "produce"]

#             for query in queries:
#                 results = perform_query(collection, query, cache)

#                 print(f"\nQuery: {query}")
#                 print("Results:", results)
#                 print("Processed context:")
#                 print(process_context(results))
#         else:
#             print("Failed to create or retrieve collection.")

#     except Exception as e:
#         print(f"An unexpected error occurred: {str(e)}")


def llm_call():
    return "Hello from the LLM"


def tavily_search(query, n=2):
    client = TavilyClient(os.getenv("TAVILY_API_KEY"))
    response = client.search(
        query,
        max_results=n,
        search_depth="advanced",
        include_answer=True,
        include_raw_content=True,
        include_images=True,
    )
    return response


def get_links_from_tavily_search(search_output, n=2):
    links = []
    content = search_output["results"]
    for item in content:
        links.append(item["url"])
    return links


def get_content_from_tavily_search(search_output, n=2):
    string_content = ""
    content = search_output["results"]
    for item in content:
        string_content += "\n\n" + item["raw_content"]
    return string_content


# from openai import OpenAI

api_key = os.getenv("OPENAI_API_KEY")


def llm_call(history, api_key: str):
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}

    # Getting the base64 string
    payload = {"model": "gpt-4o-mini", "messages": history, "max_tokens": 100}
    response = requests.post(
        "https://api.openai.com/v1/chat/completions", headers=headers, json=payload
    )
    answer = response.json()["choices"][0]["message"]["content"]
    return answer


def agent_call(llm_input, query, context):
    input = query + "\n" + context
    user_input = {"role": "user", "content": input}
    llm_input.append(user_input)
    query = query
    llm_out = llm_call(llm_input, api_key)
    return llm_out

    # print(type(youtube_search(query=query)))
    # search_outs = tavily_search(query=query)
    # print(search_outs)
    # context = get_content_from_tavily_search(search_outs)
    # # print(agent_call(llm_input=sys_message, query=query, context=context))
    # print(agent_call(llm_input=sys_message_lyrics, query=query, context=context))

    # print(image_search(query))
