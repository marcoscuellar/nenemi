// swift-tools-version: 5.9
import PackageDescription

// Nenemi's own speech plugin, packaged for Swift Package Manager.
// The community plugin ships only a CocoaPods spec, so Capacitor's SPM sync skipped it
// and the mic never reached the app. This carries the same Swift code as a local package.
let package = Package(
    name: "NenemiSpeech",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "NenemiSpeech", targets: ["NenemiSpeechPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.1")
    ],
    targets: [
        .target(
            name: "NenemiSpeechPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "Sources/NenemiSpeechPlugin"
        )
    ]
)
