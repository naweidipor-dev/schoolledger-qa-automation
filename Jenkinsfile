pipeline {
  agent any
  tools { nodejs 'NodeJS-22' }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install') { steps { bat 'npm install'; bat 'npx playwright install chromium' } }
    stage('API tests') { steps { bat 'npm test' } }
    stage('UI smoke') { steps { bat 'npm run test:ui:smoke' } }
  }
  post {
    always { archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true }
  }
}
