pipeline {
  agent any
  tools { nodejs 'NodeJS-22' }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install') { steps { bat 'npm install'; bat 'npx playwright install chromium' } }
    stage('API tests') { steps { bat 'npm test' } }
    stage('UI smoke') { steps { bat 'npx playwright test --project=chromium --grep "admin can sign in|invalid login"' } }
  }
  post {
    always { archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true }
  }
}
