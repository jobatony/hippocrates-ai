# 🚀 Development to Production Workflow

Now that your app is live, you need a safe and efficient way to build new features without breaking your live site. Here is the standard industry workflow for Continuous Integration/Continuous Deployment (CI/CD).

---

## Phase 1: Local Development (The Safe Zone)
Never edit code directly on your AWS server. Always write and test your code on your local computer first.

1. **Open your local terminal** in your project folder.
2. **Checkout the main branch** and pull the latest changes:
   ```bash
   git checkout main
   git pull origin main
   ```
3. **Create a new branch** for whatever you are working on (e.g., fixing a bug or adding a feature):
   ```bash
   git checkout -b feature-dark-mode
   ```
4. **Write your code** and test it locally using your local servers:
   * Frontend: `npm run dev`
   * Backend: `python manage.py runserver`

---

## Phase 2: Save and Push to GitHub
Once your feature is working perfectly on your local machine, save it to GitHub.

1. Add and commit your changes:
   ```bash
   git add .
   git commit -m "Added dark mode toggle"
   ```
2. Push your new branch to GitHub:
   ```bash
   git push origin feature-dark-mode
   ```
3. Go to GitHub and merge your `feature-dark-mode` branch into your **`first-production-ready`** branch.

---

## Phase 3: The Deployment (Going Live)

### 1. Frontend (Automatic)
Because your frontend is connected to Netlify, **you don't have to do anything!** 
The moment you merge your code into the `first-production-ready` branch on GitHub, Netlify will automatically detect it, rebuild your frontend, and push it live within 2 minutes.

### 2. Backend (Manual)
AWS does not automatically pull your code (unless we set up complex CI/CD pipelines). To update your backend:

1. **SSH into your AWS server:**
   ```bash
   ssh -i "your-key.pem" ubuntu@your-ec2-ip
   ```
2. **Pull the latest code:**
   ```bash
   cd hippocrates-ai
   git pull origin first-production-ready
   ```
3. **(Optional) Apply Database Changes:** 
   If you created new database models (ran `makemigrations` locally), apply them on the server:
   ```bash
   source backend/venv/bin/activate
   cd backend
   python manage.py migrate
   ```
4. **(Optional) Install New Packages:**
   If you added new packages to `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```
5. **Restart Gunicorn to apply changes:**
   ```bash
   sudo systemctl restart gunicorn
   ```

🎉 **Your new feature is now live for the world to see!**
