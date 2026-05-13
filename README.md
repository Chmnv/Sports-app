# Sports Schedule App

A simple sports match scheduling app built with FastAPI, PostgreSQL, and Nginx. Deployed using Docker and Kubernetes.

## Architecture

```
Frontend (Nginx) → Backend (FastAPI) → Database (PostgreSQL)
```

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Nginx)
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **Containerization:** Docker
- **Orchestration:** Kubernetes (Minikube)

## Prerequisites

- Docker
- Minikube
- kubectl

## Run with Kubernetes

> Note: The frontend currently communicates with the backend using a NodePort service for local Minikube development. This will later be replaced with Ingress/reverse proxy routing.

**1. Start Minikube:**
```bash
minikube start
```

**2. Get your Minikube IP:**
```bash
minikube ip
```

**3. Update the API URL in `frontend/app.js`:**
```javascript
const API = "http://<MINIKUBE_IP>:31000";
```

**4. Build Docker images:**
```bash
docker build -t sports-backend ./backend
docker build -t sports-frontend ./frontend
```

**5. Deploy to Kubernetes:**
```bash
kubectl apply -f k8s/
```

**6. Open the app:**
```bash
minikube service frontend-service
```

## Stop the app

```bash
kubectl delete -f k8s/
```

## Project Structure

```
sports-app/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── Dockerfile
└── k8s/
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── db-deployment.yaml
    └── db-service.yaml
```