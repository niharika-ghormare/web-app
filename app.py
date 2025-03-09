from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from pymongo import MongoClient
import os
from bson import json_util
import json
from flask_cors import CORS
from datetime import datetime



app = Flask(__name__)
CORS(app)
# Secure MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "")
client = MongoClient(MONGO_URI)
db = client["Webapp"]  # Database name
users_collection = db["Data"]  # Collection for storing users
user_data_collection = db["UserData"]  # New collection for user data

app.secret_key = "your_secret_key"  # Required for session and flash messages
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Helper functions for user data
def get_user_data_by_email(email):
    """Retrieve user data from MongoDB"""
    user_data = user_data_collection.find_one({"email": email})
    if user_data:
        # Convert ObjectId to string for JSON serialization
        return json.loads(json_util.dumps(user_data))
    return None

def update_user_data(email, data_type, data):
    """Save or update user data in MongoDB"""
    # Use upsert to create if doesn't exist
    result = user_data_collection.update_one(
        {"email": email},
        {"$set": {data_type: data}},
        upsert=True
    )
    return result.modified_count > 0 or result.upserted_id is not None

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        print(f"🔹 Login attempt: {email}")

        # Check if user exists in MongoDB
        user = users_collection.find_one({"email": email})
        
        if user:
            print(f"✅ User found: {user['email']}")

            # Verify the password
            if bcrypt.check_password_hash(user['password'], password):
                session['user'] = email  # Store user session
                
                # Retrieve user data on login (if exists)
                user_data = get_user_data_by_email(email)
                if user_data:
                    # You could store this in session if needed
                    # But better to fetch as needed via API endpoints
                    pass
                
                flash('Login successful!', 'success')
                print(f"✅ Login successful for {email}")
                return redirect(url_for('home'))
            else:
                flash('Invalid email or password', 'error')
                print("❌ Incorrect password")
        else:
            flash('Invalid email or password', 'error')
            print("❌ User not found")

        return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        print("🔹 Signup route triggered")
        try:
            name = request.form.get('name')
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            # Validate input fields
            if not all([name, email, password, confirm_password]):
                flash('All fields are required', 'error')
                return redirect(url_for('signup'))

            if password != confirm_password:
                flash('Passwords do not match', 'error')
                return redirect(url_for('signup'))

            if len(password) < 8:
                flash('Password must be at least 8 characters long', 'error')
                return redirect(url_for('signup'))

            if users_collection.find_one({"email": email}):
                flash("User already exists", 'error')
                return redirect(url_for('signup'))

            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

            # Insert user into MongoDB
            try:
                result = users_collection.insert_one({
                    "name": name, 
                    "email": email, 
                    "password": hashed_password
                })
                
                # Initialize user data with default values
                user_data_collection.insert_one({
                    "email": email,
                    "timerSettings": {
                        "focusDuration": 25,
                        "shortBreakDuration": 5,
                        "longBreakDuration": 15,
                        "sessionsBeforeLongBreak": 4
                    },
                    "pomodoroStats": {
                        "focusSessionsCompleted": 0,
                        "breakSessionsCompleted": 0,
                        "totalFocusTime": 0,
                        "totalBreakTime": 0
                    },
                    "tasks": [],
                    "notes": [],
                    "theme": "light"
                })
                
                print(f"✅ User inserted with ID: {result.inserted_id}")
                flash('User registered successfully!', 'success')
                return redirect(url_for('login'))
            except Exception as mongo_error:
                print(f"❌ MongoDB insertion error: {mongo_error}")
                flash(f'Database error: {str(mongo_error)}', 'error')
                return redirect(url_for('signup'))
                
        except Exception as e:
            print(f"❌ Signup error: {e}")
            flash('An error occurred during registration', 'error')
            return redirect(url_for('signup'))

    return render_template('signup.html')

@app.route('/home')
def home():
    user_email = session.get('user', 'Guest')  # Default to 'Guest' if no session
    return render_template('home.html', user_email=user_email)


@app.route('/logout')
def logout():
    session.pop('user', None)
    flash("You have been logged out", "info")
    return redirect(url_for('login'))

@app.route('/api/save-user-data', methods=['POST'])
def save_user_data_api():
    """Save specific user data type"""
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    user_email = session['user']
    
    # Get data from request
    data = request.json
    data_type = data.get('type')
    user_data = data.get('data')
    
    # Validate input
    if not data_type or user_data is None:
        return jsonify({"error": "Invalid data"}), 400
    
    # List of allowed data types to save
    ALLOWED_DATA_TYPES = ['tasks', 'notes', 'theme']
    
    if data_type not in ALLOWED_DATA_TYPES:
        return jsonify({"error": "Invalid data type"}), 400
    
    try:
        # Use upsert to update or create the data
        result = user_data_collection.update_one(
            {"email": user_email},
            {"$set": {data_type: user_data}},
            upsert=True
        )
        
        return jsonify({
            "message": f"{data_type.capitalize()} saved successfully",
            "modified": result.modified_count > 0,
            "upserted": result.upserted_id is not None
        }), 200
    
    except Exception as e:
        print(f"Error saving {data_type}: {e}")
        return jsonify({"error": f"Failed to save {data_type}"}), 500

# Modified get_user_data function to avoid naming conflict
def get_user_data(email):
    """Retrieve user data from MongoDB"""
    user_data = user_data_collection.find_one({"email": email})
    if user_data:
        # Remove MongoDB ObjectId and email before returning
        user_data.pop('_id', None)
        user_data.pop('email', None)
        return user_data
    return {}

# API routes for user data
@app.route('/api/user-data', methods=['GET'])
def get_user_data_api():
    """Get all user data or specific data type"""
    user_email = session.get('user')
    if not user_email:
        return jsonify({"error": "Not logged in"}), 401
    
    data_type = request.args.get('type')  # Optional query param
    
    user_data = get_user_data(user_email)
    if not user_data:
        return jsonify({"error": "No data found"}), 404
    
    if data_type and data_type in user_data:
        return jsonify({data_type: user_data[data_type]})
    
    # Remove MongoDB ID and email from response
    if '_id' in user_data:
        del user_data['_id']
    if 'email' in user_data:
        del user_data['email']
        
    return jsonify(user_data)

@app.route('/api/save-productivity-history', methods=['POST'])
def save_productivity_history():
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    user_email = session['user']
    history_data = request.json  # Direct data, not wrapped

    print(f"Received productivity history for {user_email}: {history_data}")
    
    if not history_data:
        return jsonify({"error": "Invalid data"}), 400
    
    try:
        result = user_data_collection.update_one(
            {"email": user_email},
            {"$set": {"productivityStatsHistory": history_data}},
            upsert=True
        )
        
        print(f"Productivity history save result: modified={result.modified_count}, upserted={result.upserted_id}")
        
        return jsonify({
            "message": "Productivity stats history saved successfully",
            "modified": result.modified_count > 0,
            "upserted": result.upserted_id is not None
        }), 200
    
    except Exception as e:
        print(f"Error saving productivity stats history: {e}")
        return jsonify({"error": f"Failed to save productivity stats history: {str(e)}"}), 500
    

@app.route('/api/save-timer-settings', methods=['POST'])
def save_timer_settings():
    """Save timer settings for the logged-in user"""
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    user_email = session['user']
    timer_settings = request.json
    
    # Validate input
    required_keys = ['focusDuration', 'shortBreakDuration', 'longBreakDuration', 'sessionsBeforeLongBreak']
    if not all(key in timer_settings for key in required_keys):
        return jsonify({"error": "Invalid timer settings"}), 400
    
    try:
        # Update timer settings in user data collection
        result = user_data_collection.update_one(
            {"email": user_email},
            {"$set": {"timerSettings": timer_settings}},
            upsert=True
        )
        
        return jsonify({
            "message": "Timer settings saved successfully",
            "modified": result.modified_count > 0,
            "upserted": result.upserted_id is not None
        }), 200
    
    except Exception as e:
        print(f"Error saving timer settings: {e}")
        return jsonify({"error": "Failed to save timer settings"}), 500

@app.route('/api/save-timer-stats', methods=['POST'])
def save_timer_stats():
    """Save timer statistics for the logged-in user"""
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    user_email = session['user']
    timer_stats = request.json
    
    # Validate input
    required_keys = ['focusSessionsCompleted', 'breakSessionsCompleted', 'totalFocusTime', 'totalBreakTime']
    if not all(key in timer_stats for key in required_keys):
        return jsonify({"error": "Invalid timer statistics"}), 400
    
    try:
        # Update timer stats in user data collection
        result = user_data_collection.update_one(
            {"email": user_email},
            {"$set": {"pomodoroStats": timer_stats}},
            upsert=True
        )
        
        return jsonify({
            "message": "Timer statistics saved successfully",
            "modified": result.modified_count > 0,
            "upserted": result.upserted_id is not None
        }), 200
    
    except Exception as e:
        print(f"Error saving timer statistics: {e}")
        return jsonify({"error": "Failed to save timer statistics"}), 500

# NEW API ENDPOINT: Save session data
@app.route('/api/sessions', methods=['POST'])
def save_session_data():
    """Save pomodoro session data"""
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    user_email = session['user']
    session_data = request.json
    
    if not session_data:
        return jsonify({"error": "Invalid data"}), 400
    
    try:
        # Add timestamp and user email
        session_data['timestamp'] = datetime.now()
        session_data['email'] = user_email
        
        # Store in a new sessions collection
        db['UserSessions'].insert_one(session_data)
        
        # Also update user's aggregate statistics
        user_data = user_data_collection.find_one({"email": user_email})
        if user_data and 'pomodoroStats' in user_data:
            current_stats = user_data['pomodoroStats']
            
            # Update the stats
            updated_stats = {
                'focusSessionsCompleted': current_stats.get('focusSessionsCompleted', 0) + session_data.get('focusSessionsCompleted', 0),
                'breakSessionsCompleted': current_stats.get('breakSessionsCompleted', 0) + 
                    (session_data.get('shortBreaksCompleted', 0) + session_data.get('longBreaksCompleted', 0)),
                'totalFocusTime': current_stats.get('totalFocusTime', 0) + session_data.get('totalFocusTime', 0),
                'totalBreakTime': current_stats.get('totalBreakTime', 0) + session_data.get('totalBreakTime', 0)
            }
            
            # Update user data
            user_data_collection.update_one(
                {"email": user_email},
                {"$set": {"pomodoroStats": updated_stats}}
            )
        
        return jsonify({"message": "Session data saved successfully"}), 200
    
    except Exception as e:
        print(f"Error saving session data: {e}")
        return jsonify({"error": f"Failed to save session data: {str(e)}"}), 500

# NEW API ENDPOINT: Get session history
@app.route('/api/sessions', methods=['GET'])
def get_session_history():
    """Get user's pomodoro session history"""
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    user_email = session['user']
    
    try:
        # Get all sessions for this user
        sessions = list(db['UserSessions'].find({"email": user_email}).sort("timestamp", -1))
        
        # Convert ObjectIds to strings for JSON serialization
        serialized_sessions = json.loads(json_util.dumps(sessions))
        
        return jsonify({"sessions": serialized_sessions}), 200
    
    except Exception as e:
        print(f"Error retrieving session history: {e}")
        return jsonify({"error": "Failed to retrieve session history"}), 500

@app.route('/timer')
def timer():
    return render_template('timer.html')

@app.route('/journal')
def journal():
    return render_template('journal.html')

@app.route('/postreview', methods=['GET', 'POST'])
def postreview():
    # Your post-review page logic
    return render_template('postreview.html')

@app.route('/statistics')
def statistics():
    return render_template('statistics.html')

if __name__ == '__main__':
    app.run(debug=True, port=5500)