pipeline {
    def nodeVersion = 'node-20.16.0'

    stage('Checkout') {
        deleteDir()
        def scmVars = checkout scm
        tag = env.BRANCH_NAME.replace("/", "-").substring(0, Math.min(env.BRANCH_NAME.length(), 56)) + "-" + "${scmVars.GIT_COMMIT.substring(0, 6)}"
    }

    nodejs(nodeJSInstallationName: nodeVersion) {
        stage('Build') {
            sh 'npm config fix'
            sh 'npm ci'
            //sh 'npm run build'
        }

        stage('Lint') {
            sh 'npm run lint'
        }
    }

    stage('Test') {
        agent {
            docker {
                image 'zenika/alpine-chrome'
                // Run the container on the node specified at the
                // top-level of the Pipeline, in the same workspace,
                // rather than on a new node entirely:
                reuseNode true
            }
        }
        steps {
            script {
                sh 'npm run test'
            }
        }
    }

    npmSonarV2 nodeVersion: nodeVersion,
        sonarServer: 'sonar-server',
        checkQualityGate: true

}
