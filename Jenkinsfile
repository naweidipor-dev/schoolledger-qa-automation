pipeline {
  agent any
  tools { nodejs 'NodeJS-22' }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install') { steps { sh 'npm install'; sh 'npx playwright install --with-deps chromium' } }
    stage('API tests') { steps { sh 'npm test' } }
    stage('UI smoke') { steps { sh 'npx playwright test --project=chromium --grep "admin can sign in|invalid login"' } }
  }
  post {
    always { archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true }
  }
}
