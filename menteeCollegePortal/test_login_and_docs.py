#!/usr/bin/env python3
import requests
import json

# API base URL
API_BASE = "https://api.menteecollege.com"

# Login credentials
username = "andrewbrowne"
password = "Sierra-Ciara$"

print("Testing Document Management System")
print("==================================")

# Step 1: Login to get JWT token
print("\n1. Logging in...")
login_data = {
    "username": username,
    "password": password
}

try:
    login_response = requests.post(f"{API_BASE}/api/users/login/", json=login_data)
    print(f"Login status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        tokens = login_response.json()
        access_token = tokens.get("access")
        refresh_token = tokens.get("refresh")
        print("Login successful!")
        print(f"Access token (first 50 chars): {access_token[:50]}...")
        
        # Set up headers with token
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Step 2: Get user profile to check permissions
        print("\n2. Fetching user profile...")
        profile_response = requests.get(f"{API_BASE}/api/users/profile/", headers=headers)
        if profile_response.status_code == 200:
            profile = profile_response.json()
            print(f"User: {profile.get('username', 'N/A')}")
            print(f"Is Staff: {profile.get('is_staff', False)}")
            print(f"Email: {profile.get('email', 'N/A')}")
        else:
            print(f"Profile fetch failed: {profile_response.status_code}")
            print(f"Response: {profile_response.text}")
        
        # Step 3: Test Documents API
        print("\n3. Testing Documents API...")
        docs_response = requests.get(f"{API_BASE}/api/documents/", headers=headers)
        print(f"Documents API status: {docs_response.status_code}")
        
        if docs_response.status_code == 200:
            docs_data = docs_response.json()
            print(f"Response type: {type(docs_data)}")
            
            if isinstance(docs_data, dict):
                print(f"Response keys: {docs_data.keys()}")
                if 'results' in docs_data:
                    documents = docs_data['results']
                    print(f"Number of documents: {len(documents)}")
                    if documents:
                        print("\nFirst document:")
                        print(json.dumps(documents[0], indent=2))
                else:
                    print("No 'results' key in response")
                    print(f"Full response: {json.dumps(docs_data, indent=2)}")
            elif isinstance(docs_data, list):
                print(f"Number of documents: {len(docs_data)}")
                if docs_data:
                    print("\nFirst document:")
                    print(json.dumps(docs_data[0], indent=2))
        else:
            print(f"Documents fetch failed: {docs_response.status_code}")
            print(f"Response: {docs_response.text}")
        
        # Step 4: Test Cohorts API
        print("\n4. Testing Cohorts API...")
        cohorts_response = requests.get(f"{API_BASE}/api/cohorts/", headers=headers)
        print(f"Cohorts API status: {cohorts_response.status_code}")
        
        if cohorts_response.status_code == 200:
            cohorts_data = cohorts_response.json()
            if isinstance(cohorts_data, dict) and 'results' in cohorts_data:
                print(f"Number of cohorts: {len(cohorts_data['results'])}")
            elif isinstance(cohorts_data, list):
                print(f"Number of cohorts: {len(cohorts_data)}")
        else:
            print(f"Cohorts fetch failed: {cohorts_response.status_code}")
            
        # Step 5: Test Categories API
        print("\n5. Testing Document Categories API...")
        categories_response = requests.get(f"{API_BASE}/api/document-categories/", headers=headers)
        print(f"Categories API status: {categories_response.status_code}")
        
        if categories_response.status_code == 200:
            categories_data = categories_response.json()
            if isinstance(categories_data, dict) and 'results' in categories_data:
                print(f"Number of categories: {len(categories_data['results'])}")
            elif isinstance(categories_data, list):
                print(f"Number of categories: {len(categories_data)}")
        else:
            print(f"Categories fetch failed: {categories_response.status_code}")
            
    else:
        print(f"Login failed with status: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        
except Exception as e:
    print(f"Error: {e}")

print("\n==================================")
print("Test complete!")