pipeline {
    agent any

    environment {
        DOCKER_USERNAME = 'sylvester1215'
        DOCKER_PASSWORD = 'T0238879g'
         AZURE_APP_ID = credentials('61cf3114-cb52-4558-a403-b95ba91e285c')
    AZURE_PASSWORD = credentials('61cf3114-cb52-4558-a403-b95ba91e285c')
    AZURE_TENANT_ID = credentials('61cf3114-cb52-4558-a403-b95ba91e285c')
    AZURE_SUBSCRIPTION_ID = credentials('61cf3114-cb52-4558-a403-b95ba91e285c')
    }

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
                    sh 'docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD'

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
                    sh 'az login --service-principal -u $AZURE_APP_ID -p $AZURE_PASSWORD --tenant $AZURE_TENANT_ID'

                    // Check if AKS exists, if not create it
                    sh 'az aks show --resource-group rmsResourceGroup --name rmsAKSCluster -o json >nul 2>nul || az aks create --resource-group rmsResourceGroup --name rmsAKSCluster --node-count 1 --generate-ssh-keys 2>&1'

                    // Get AKS credentials
                    sh 'az aks get-credentials --resource-group "rmsResourceGroup" --name "rmsAKSCluster" --overwrite-existing --subscription "$AZURE_SUBSCRIPTION_ID"'
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