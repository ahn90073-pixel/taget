package com.taget.app

import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeStorage")
class NativeStoragePlugin : Plugin() {
    private val preferences by lazy {
        context.getSharedPreferences("taget_native_storage", Context.MODE_PRIVATE)
    }

    @PluginMethod
    fun set(call: PluginCall) {
        val key = call.getString("key")
        val value = call.getString("value")

        if (key.isNullOrBlank() || value == null) {
            call.reject("key and value are required")
            return
        }

        preferences.edit().putString(key, value).apply()
        call.resolve()
    }

    @PluginMethod
    fun get(call: PluginCall) {
        val key = call.getString("key")

        if (key.isNullOrBlank()) {
            call.reject("key is required")
            return
        }

        val result = JSObject()
        result.put("value", preferences.getString(key, null))
        call.resolve(result)
    }

    @PluginMethod
    fun remove(call: PluginCall) {
        val key = call.getString("key")

        if (key.isNullOrBlank()) {
            call.reject("key is required")
            return
        }

        preferences.edit().remove(key).apply()
        call.resolve()
    }
}
