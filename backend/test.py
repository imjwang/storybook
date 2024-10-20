import requests
import json

# Base URL of our FastAPI application
BASE_URL = "http://localhost:8000"

def test_add_texts():
    url = f"{BASE_URL}/add_texts/"
    data = [
        {"text": "The quick brown fox jumps over the lazy dog", "metadata": {"id": "1"}},
        {"text": "Python is a versatile programming language", "metadata": {"id": "2"}},
        {"text": "FastAPI makes it easy to build APIs", "metadata": {"id": "3"}},
        {"text": "Natural language processing is a subfield of artificial intelligence", "metadata": {"id": "4"}},
        {"text": "Vector databases are useful for similarity search", "metadata": {"id": "5"}}
    ]
    response = requests.post(url, json=data)
    print("Add Texts Response:", response.json())

def test_query(query_text, n_results=2, use_cache=False):
    url = f"{BASE_URL}/query/"
    data = {
        "query": query_text,
        "n_results": n_results,
        "use_cache": use_cache
    }
    response = requests.post(url, json=data)
    print(f"Query: '{query_text}'")
    print("Response:", json.dumps(response.json(), indent=2))


def test_get_markdown(query_text):
    url = f"{BASE_URL}/get-markdown?input_text={query_text}"
    response = requests.get(url)
    print(f"Query: '{query_text}'")
    print("Response:", json.dumps(response.json(), indent=2))

def test_collection_info():
    url = f"{BASE_URL}/collection_info/"
    response = requests.get(url)
    print("Collection Info:", response.json())

if __name__ == "__main__":
    # Test adding texts
    test_add_texts()

    # Test getting collection info
    # test_collection_info()

    # Test querying
    print("\nTesting queries:")
    # test_query("programming languages", use_cache = False)
    # test_query("artificial intelligence", use_cache = False)
    # test_query("database systems", use_cache = False)
    # test_query("programming languages")
    # test_query("artificial intelligence")
    # test_query("database systems")


    test_get_markdown("The session explored potential blockchain applications across various industries. Participants brainstormed use cases leveraging blockchain's key features: decentralization, transparency, and immutability. Ideas ranged from supply chain tracking to decentralized finance solutions. The group discussed technical challenges, scalability concerns, and regulatory considerations. They prioritized ideas based on feasibility and potential impact. Action items included further research on top concepts and identifying potential partners for pilot projects.")
