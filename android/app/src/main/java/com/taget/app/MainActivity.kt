package com.taget.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(NativeStoragePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
