plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "net.justies.autoclicker"
    compileSdk = 34

    defaultConfig {
        applicationId = "net.justies.autoclicker"
        minSdk = 24 // dispatchGesture() 최소 버전
        targetSdk = 34
        versionCode = 2
        versionName = "0.2"
    }

    // CI 러너마다 debug 키가 새로 생기면 업데이트 설치가 막힌다. 고정 키를 저장소에 둔다.
    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
