
import httpx
import asyncio
import datetime
import sys

BASE_URL = "http://localhost:8001"
TODAY = datetime.date.today().isoformat()

async def test_endpoint(client, method, url, data=None, expected_status=200):
    print(f"Testing {method} {url}...", end=" ")
    try:
        if method == "GET":
            response = await client.get(url)
        elif method == "POST":
            response = await client.post(url, json=data)
        
        if response.status_code == expected_status:
            print(f"✅ OK ({response.status_code})")
            return True
        else:
            print(f"❌ FAILED ({response.status_code})")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

async def main():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        print(f"Starting API Tests against {BASE_URL}")
        
        # 1. Test Daily Tasks
        print("\n--- Testing Daily Tasks ---")
        await test_endpoint(client, "GET", f"/api/tasks/{TODAY}")

        # 2. Test Heatmap Stats
        print("\n--- Testing Heatmap Stats ---")
        await test_endpoint(client, "GET", "/api/stats/heatmap")

        # 3. Test Chat API
        print("\n--- Testing Chat API ---")
        chat_payload = {
            "message": "Hello, this is a test.",
            "context": "Test context",
            "title": "Test Title"
        }
        # Note: Chat API might be streaming, so we just check connection
        try:
            print(f"Testing POST /api/chat...", end=" ")
            async with client.stream("POST", "/api/chat", json=chat_payload) as response:
                if response.status_code == 200:
                    print(f"✅ OK ({response.status_code})")
                    # Read a bit of the stream
                    async for chunk in response.aiter_text():
                        if chunk:
                            print(f"Received chunk: {chunk[:50]}...")
                            break
                else:
                    print(f"❌ FAILED ({response.status_code})")
        except Exception as e:
            print(f"❌ ERROR: {e}")

        # 4. Test Quiz Generation
        print("\n--- Testing Quiz Generation ---")
        quiz_payload = {
            "content": "This is a test content about arrays and sorting algorithms."
        }
        await test_endpoint(client, "POST", "/api/generate-quiz", quiz_payload)

        # 5. Test Knowledge List
        print("\n--- Testing Knowledge List ---")
        await test_endpoint(client, "GET", "/api/knowledge")

        # 6. Test Study Plan Progress
        print("\n--- Testing Study Plan Progress ---")
        await test_endpoint(client, "GET", "/api/study-plan/progress")

        # 7. Test Papers
        print("\n--- Testing Papers ---")
        await test_endpoint(client, "GET", "/api/papers")

        # 8. Test GitHub Commits
        print("\n--- Testing GitHub Commits ---")
        await test_endpoint(client, "GET", "/api/github/commits")

        # 9. Test Profile
        print("\n--- Testing Profile ---")
        await test_endpoint(client, "GET", "/api/profile")

        # 10. Test Achievements
        print("\n--- Testing Achievements ---")
        await test_endpoint(client, "GET", "/api/achievements")

        # 11. Test Shop Rewards
        print("\n--- Testing Shop Rewards ---")
        await test_endpoint(client, "GET", "/api/shop/rewards")

if __name__ == "__main__":
    asyncio.run(main())
