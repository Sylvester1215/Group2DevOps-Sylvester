pipeline {
    agent any
    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    sh 'npm install'
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                script {
                    sh 'npm run backend-test'
                }
            }
        }

        stage('Frontend Instrumentation and Tests') {
            steps {
                script {
                    sh 'npm run frontend-instrument'
                    sh 'npm run frontend-test'
                }
            }
        }

        stage('Docker Login and Build') {
            steps {
                script {
                    // Docker login
                    sh 'docker login -u sylvester1215 -p T0238879g'

                    // Build and push Docker images
                    sh 'docker-compose build'
                    sh 'docker-compose push'
                }
            }
        }

        stage('Azure Login and AKS Setup') {
            steps {
                script {
                    // Azure CLI login
                    sh 'az login --service-principal -u "7f6c399a-c556-46dc-a1d0-1826855f4efd" -p "KtT8Q~yhYlWY53lfG2IhH2wCidGfQS5LjAtNwaDW" --tenant "25a99bf0-8e72-472a-ae50-adfbdf0df6f1"'

                    // Check if AKS exists, if not create it
                    sh 'az aks show --resource-group rmsResourceGroup --name rmsAKSCluster -o json >nul 2>nul || az aks create --resource-group rmsResourceGroup --name rmsAKSCluster --node-count 1 --generate-ssh-keys 2>&1'

                    // Get AKS credentials
                    sh 'az aks get-credentials --resource-group "rmsResourceGroup" --name "rmsAKSCluster" --overwrite-existing --subscription "b3ebfc85-170b-4a0d-add6-986baf343e61"'
                }
            }
        }

        stage('Kubernetes Deployment') {
            steps {
                script {
                    // Apply deployment and service YAML files to Kubernetes
                    sh 'kubectl apply -f rms-deployment.yaml'
                    sh 'kubectl apply -f rms-service.yaml'
                }
            }
        }

        stage('Kubernetes Monitoring') {
            steps {
                script {
                    // Check rollout history and get pods and services information
                    sh 'kubectl rollout history deployment/rms-deployment'
                    sh 'kubectl get pods'
                    sh 'kubectl get services'
                }
            }
        }
    }
}