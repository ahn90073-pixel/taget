import Foundation
import Capacitor

@objc(NativeStoragePlugin)
public class NativeStoragePlugin: CAPPlugin {
    private let defaults = UserDefaults.standard
    private let storageSuite = "taget_native_storage"

    private var storage: UserDefaults {
        UserDefaults(suiteName: storageSuite) ?? defaults
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty,
              let value = call.getString("value") else {
            call.reject("key and value are required")
            return
        }

        storage.set(value, forKey: key)
        call.resolve()
    }

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("key is required")
            return
        }

        call.resolve(["value": storage.string(forKey: key) as Any])
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("key is required")
            return
        }

        storage.removeObject(forKey: key)
        call.resolve()
    }
}
