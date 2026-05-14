# Sports Schedule App

Pet project for learning Docker and Kubernetes. Simple app for scheduling sports matches and tracking results.

## Stack

- FastAPI + PostgreSQL (backend)
- HTML/CSS/JS + Nginx (frontend)
- Kubernetes + Nginx Ingress (deployment)

## Requirements

- Docker
- Minikube
- kubectl

## Run

```bash
# Start minikube and enable ingress
minikube start
minikube addons enable ingress

# Build images
docker build -t sports-backend ./backend
docker build -t sports-frontend ./frontend

# Deploy
kubectl apply -f k8s/

# Get IP and open in browser
minikube ip
# open http://
```

## Stop

```bash
kubectl delete -f k8s/
```

## Structure

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
    ├── db-service.yaml
    └── ingress.yaml
```