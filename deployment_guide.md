# Deployment Guide: Django (AWS) & React/Vite (Netlify)

This guide walks you through transitioning your Distinction AI application from development to production. We will deploy the **Django Backend** to AWS Free Tier (EC2 + RDS) and the **React/Vite Frontend** to Netlify.

---

## 🔒 1. General Best Practices for Production

Before deploying, ensure you follow these critical transition practices:
*   **Version Control:** Both frontend and backend should be pushed to a Git provider (like GitHub or GitLab).
*   **Environment Variables:** Never hardcode secrets. Use environment variables for API keys, database credentials, and secret keys.
*   **Disable Debug Mode:** Ensure `DEBUG = False` in your Django settings for production.
*   **HTTPS is Mandatory:** Netlify hosts your frontend on HTTPS. Browsers will block requests to an HTTP backend (Mixed Content Error). Your AWS backend **must** have a domain name and an SSL certificate.

---

## ⚙️ 2. Backend Preparation (Django)

### A. Environment & Security
1.  **Environment Variables:** Make sure you are using a library like `python-dotenv` or `environ` in `settings.py` to read secrets.
    ```python
    # settings.py
    import os
    from dotenv import load_dotenv
    load_dotenv()

    SECRET_KEY = os.environ.get('SECRET_KEY')
    DEBUG = os.environ.get('DEBUG', 'False') == 'True'
    ```
2.  **Allowed Hosts & CORS:** Update these to allow your future EC2 domain and Netlify frontend.
    ```python
    ALLOWED_HOSTS = ['your-backend-domain.com', 'your-ec2-ip']
    CORS_ALLOWED_ORIGINS = ['https://your-frontend-app.netlify.app']
    ```

### B. Database & Static Files
1.  **PostgreSQL:** SQLite isn't meant for production. Update `requirements.txt` with `psycopg2-binary` (PostgreSQL adapter).
2.  **Static Files:** Install `whitenoise` to serve static files efficiently directly from Gunicorn.
    *   `pip install whitenoise`
    *   Add `'whitenoise.middleware.WhiteNoiseMiddleware'` to your `MIDDLEWARE` in `settings.py`.
    *   Set `STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')`.
3.  **WSGI Server:** Install `gunicorn`. It replaces Django's built-in development server.
    *   `pip install gunicorn`

> **Action:** Update your `backend/requirements.txt` (`pip freeze > requirements.txt`) and push to GitHub.

---

## ☁️ 3. AWS Backend Deployment (Free Tier)

### A. Setup AWS RDS (Database)
1.  Go to the AWS Console and search for **RDS**.
2.  Click **Create database**.
3.  Select **PostgreSQL** and choose the **Free tier** template.
4.  Set your Master username and password (save these!).
5.  Under **Connectivity**, ensure "Public access" is **No** (your EC2 instance will access it securely within the same VPC).
6.  Create the database and note down the **Endpoint** (host) once it's available.

### B. Setup AWS EC2 (Server)
1.  Go to the AWS Console and search for **EC2**.
2.  Click **Launch Instance**.
3.  Select **Ubuntu Server 24.04 LTS** (Free tier eligible).
4.  Choose **t2.micro** (or t3.micro depending on your region).
5.  Create a new **Key Pair** (e.g., `distinction-key.pem`), download it, and keep it safe.
6.  Under **Network Settings**, check boxes to **Allow SSH**, **Allow HTTP**, and **Allow HTTPS** traffic.
7.  Launch the instance. Note the **Public IPv4 address**.

### C. Configure EC2
SSH into your EC2 instance using your terminal:
```bash
chmod 400 distinction-key.pem
ssh -i "distinction-key.pem" ubuntu@<your-ec2-ip>
```

Run the following commands on the server to install dependencies:
```bash
sudo apt update
sudo apt install python3-pip python3-venv python3-dev libpq-dev postgresql postgresql-contrib nginx curl
```

### D. Deploy Code
1.  Clone your GitHub repo: `git clone https://github.com/yourusername/distinction-repo.git`
2.  Go to the backend folder: `cd distinction-repo/backend`
3.  Create a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
4.  Create a `.env` file (`nano .env`) on the server and add your production variables:
    ```env
    SECRET_KEY=your_secure_random_key
    DEBUG=False
    DB_NAME=postgres
    DB_USER=postgres
    DB_PASSWORD=your_rds_password
    DB_HOST=your_rds_endpoint
    DB_PORT=5432
    ```
5.  Run migrations and collect static files:
    ```bash
    python manage.py migrate
    python manage.py collectstatic
    ```

### E. Setup Gunicorn and Nginx
1.  **Gunicorn:** Test it works by running: `gunicorn hippocrates.wsgi:application --bind 0.0.0.0:8000`. (Press Ctrl+C to exit).
    Create a systemd service for it to keep it running in the background.
    ```bash
    sudo nano /etc/systemd/system/gunicorn.service
    ```
    *Refer to standard Gunicorn + Nginx Django setup tutorials for the exact service file configuration.*
2.  **Nginx:** Configure Nginx to proxy requests to Gunicorn.
    ```bash
    sudo nano /etc/nginx/sites-available/hippocrates
    ```
3.  **Domain & SSL:** Point a domain name (like `api.yourdomain.com`) to your EC2 IP. Install `certbot` and run `sudo certbot --nginx -d api.yourdomain.com` to get a free SSL certificate. **(Crucial for Netlify integration)**.

---

## 🎨 4. Frontend Preparation (React/Vite)

1.  **API Base URL:** Ensure your frontend makes requests to an environment variable rather than `http://localhost:8000`.
    Create a `.env` (for local) and `.env.production` file in your `frontend/` directory.
    ```env
    # frontend/.env.production
    VITE_API_BASE_URL=https://api.yourdomain.com
    ```
2.  Update your Axios/Fetch calls to use `import.meta.env.VITE_API_BASE_URL`.
3.  Ensure your code builds successfully locally:
    ```bash
    npm run build
    ```
4.  Commit and push these changes to GitHub.

---

## 🚀 5. Netlify Frontend Deployment

1.  Log in to [Netlify](https://www.netlify.com/).
2.  Click **Add new site** > **Import an existing project**.
3.  Connect to your GitHub account and select your repository.
4.  **Configuration:**
    *   **Base directory:** `frontend` (Important! Tell Netlify where the React app lives).
    *   **Build command:** `npm run build`
    *   **Publish directory:** `frontend/dist`
5.  **Environment Variables:** Click on "Show advanced" > "New variable".
    *   Key: `VITE_API_BASE_URL`
    *   Value: `https://api.yourdomain.com` (Your secure AWS backend URL).
6.  Click **Deploy site**.
7.  Netlify will automatically build and publish your frontend. It will provide you with a `.netlify.app` URL (which you should add to your Django `CORS_ALLOWED_ORIGINS`).

---

### 🎉 Next Steps
*   Update your Django `CORS_ALLOWED_ORIGINS` on the EC2 server with your newly generated Netlify URL and restart Gunicorn (`sudo systemctl restart gunicorn`).
*   Test the full flow from the live frontend to the live backend!
