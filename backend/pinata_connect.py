import os
import json
from typing import Dict, Optional, Any, Union
from dotenv import load_dotenv
import requests
from requests.exceptions import RequestException

load_dotenv()

class PinataClient:
    """A client for interacting with Pinata's IPFS service."""
    
    def __init__(self) -> None:
        """Initialize the Pinata client with configuration from environment variables."""
        self.jwt = os.getenv("PINATA_JWT")
        if not self.jwt:
            raise ValueError("PINATA_JWT environment variable is not set")
            
        self.base_url = "https://api.pinata.cloud"
        self.gateway_url = "https://gateway.pinata.cloud/ipfs"
        self.headers = {
            "Authorization": f"Bearer {self.jwt}",
            "Content-Type": "application/json"
        }
    
    def upload_json(self, json_data: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """
        Upload JSON data to Pinata IPFS.

        Args:
            json_data: Dictionary containing the JSON data to upload

        Returns:
            Dictionary containing the IPFS hash and timestamp if successful,
            None if upload fails

        Raises:
            RequestException: If the request to Pinata fails
        """
        try:
            response = requests.post(
                f"{self.base_url}/pinning/pinJSONToIPFS",
                headers=self.headers,
                json=json_data
            )
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            raise RequestException(f"Failed to upload JSON data: {str(e)}")

    def retrieve_json(self, ipfs_hash: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve JSON data from Pinata IPFS using its hash.

        Args:
            ipfs_hash: The IPFS hash of the content to retrieve

        Returns:
            Dictionary containing the file metadata if found,
            None if the file is not found or request fails

        Raises:
            RequestException: If the request to Pinata fails
        """
        try:
            # First get metadata from Pinata API
            response = requests.get(
                f"{self.base_url}/data/pinList?hashContains={ipfs_hash}",
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            if not data.get('rows'):
                return None                
            content_response = requests.get(f"{self.gateway_url}/{ipfs_hash}")
            content_response.raise_for_status()
            return {
                'metadata': data['rows'][0],
                'content': content_response.json()
            }
        except RequestException as e:
            raise RequestException(f"Failed to retrieve JSON data: {str(e)}")

    def delete_json(self, ipfs_hash: str) -> bool:
        """
        Delete (unpin) JSON data from Pinata IPFS.

        Args:
            ipfs_hash: The IPFS hash of the content to delete

        Returns:
            True if deletion was successful, False otherwise

        Raises:
            RequestException: If the request to Pinata fails
        """
        try:
            response = requests.delete(
                f"{self.base_url}/pinning/unpin/{ipfs_hash}",
                headers=self.headers
            )
            response.raise_for_status()
            return True
        except RequestException as e:
            raise RequestException(f"Failed to delete JSON data: {str(e)}")

    def update_json(self, json_data: Dict[str, Any], old_ipfs_hash: str) -> Optional[str]:
        """
        Update JSON data in Pinata IPFS by uploading new data and deleting old data.

        Args:
            json_data: Dictionary containing the new JSON data
            old_ipfs_hash: The IPFS hash of the content to update

        Returns:
            New IPFS hash if update was successful, None otherwise

        Raises:
            RequestException: If any request to Pinata fails
        """
        try:
            upload_response = self.upload_json(json_data)
            if not upload_response:
                return None
            new_ipfs_hash = upload_response["IpfsHash"]            
            if self.delete_json(old_ipfs_hash):
                return new_ipfs_hash
            return None
        except RequestException as e:
            raise RequestException(f"Failed to update JSON data: {str(e)}")
