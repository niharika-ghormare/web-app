from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
from pymongo import MongoClient
import os

app = Flask(__name__)

# Secure MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://niharikaghormare123:niharikaghormaere123@cluster0.vuvza.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = MongoClient(MONGO_URI)
db = client["Webapp"]  # Database name
users_collection = db["Data"]  # Collection for storing users

app.secret_key = "your_secret_key"  # Required for session and flash messages
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Check if user exists in MongoDB
        user = users_collection.find_one({"email": email})
        
        if user and bcrypt.check_password_hash(user['password'], password):
            session['user'] = email  # Store user session
            return redirect(url_for('home'))
        else:
            flash('Invalid email or password', 'error')
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
            terms = request.form.get('terms')  # Get the terms checkbox value
            
            print(f"Received signup request: {name}, {email}")

            # Check if all required fields are provided
            if not all([name, email, password, confirm_password, terms]):
                flash('All fields are required', 'error')
                return redirect(url_for('signup'))

            if password != confirm_password:
                flash('Passwords do not match', 'error')
                return redirect(url_for('signup'))

            # Check password strength (optional)
            if len(password) < 8:
                flash('Password must be at least 8 characters long', 'error')
                return redirect(url_for('signup'))

            if users_collection.find_one({"email": email}):
                flash("User already exists", 'error')
                return redirect(url_for('signup'))

            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            
            # Add error checking for MongoDB insert
            try:
                result = users_collection.insert_one({
                    "name": name, 
                    "email": email, 
                    "password": hashed_password
                })
                print(f"User inserted with ID: {result.inserted_id}")
                
                flash('User registered successfully!', 'success')
                return redirect(url_for('login'))
            except Exception as mongo_error:
                print(f"MongoDB insertion error: {mongo_error}")
                flash(f'Database error: {str(mongo_error)}', 'error')
                return redirect(url_for('signup'))
                
        except Exception as e:
            print(f"Signup error: {e}")
            flash('An error occurred during registration', 'error')
            return redirect(url_for('signup'))

    return render_template('signup.html')


@app.route('/home')
def home():
    user_email = session.get('user', 'Guest')  # Default to 'Guest' if no session
    return render_template('home.html', user_email=user_email)  # Pass user status to template


@app.route('/logout')
def logout():
    session.pop('user', None)
    flash("You have been logged out", "success")
    return redirect(url_for('login'))

@app.route('/timer')
def timer():
    return render_template('timer.html')

@app.route('/journal')
def journal():
    return render_template('journal.html')

@app.route('/statistics')
def statistics():
    return "Statistics page coming soon!"

@app.route('/settings')
def settings():
    return "Settings page coming soon!"

@app.route('/menu')
def menu():
    return "Menu page coming soon!"

if __name__ == '__main__':
    app.run(debug=True, port=5500)
