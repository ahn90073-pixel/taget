import Foundation
import Capacitor

@objc(NativeStoragePlugin)
public class NativeStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeStoragePlugin"
    public let jsName = "NativeStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise)
    ]

    private let defaults = UserDefaults.standard
    private let storageSuite = "taget_native_storage"

    private var storage: UserDefaults {
        UserDefaults(suiteName: storageSuite) ?? defaults
    }

    @objc func set(_ call: CAPPluginCall) {
        let key = call.getString("key", "")
        let value = call.getString("value", "")
        guard !key.isEmpty, !value.isEmpty else {
            call.resolve(["error": "key and value are required"])
            return
        }

        storage.set(value, forKey: key)
        call.resolve()
    }

    @objc func get(_ call: CAPPluginCall) {
        let key = call.getString("key", "")
        guard !key.isEmpty else {
            call.resolve(["error": "key is required"])
            return
        }

        call.resolve(["value": storage.string(forKey: key) as Any])
    }

    @objc func remove(_ call: CAPPluginCall) {
        let key = call.getString("key", "")
        guard !key.isEmpty else {
            call.resolve(["error": "key is required"])
            return
        }

        storage.removeObject(forKey: key)
        call.resolve()
    }
}
