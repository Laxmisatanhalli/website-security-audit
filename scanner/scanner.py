import requests

url = input("Enter website URL: ")

response = requests.get(url)

print("Status Code:", response.status_code)
print("Website:", response.url)