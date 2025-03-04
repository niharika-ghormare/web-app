import pymongo
client = pymongo.MongoClient("mongodb+srv://niharikaghormare123:niharikaghormaere123@cluster0.vuvza.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
print(client.server_info())  # This should return MongoDB info or an error.
print(client.list_database_names())  # This will list all databases
db = client["Webapp"]
print(db.list_collection_names())  # This should list all collections in the database

users_collection = db["Data"]
print(users_collection.count_documents({}))  # Should return document count
test_doc = {
    "name": "Test User",
    "email": "test@example.com"
}
users_collection.insert_one(test_doc)
print("✅ Document inserted successfully")
