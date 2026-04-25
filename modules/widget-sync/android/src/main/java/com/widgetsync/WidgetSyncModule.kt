package com.widgetsync

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetSyncModule : Module() {
    companion object {
        const val PREFS_NAME    = "everly_widget_prefs"
        const val DATA_KEY      = "everly_widget_data"
        const val UPDATE_ACTION = "com.everlycare.app.UPDATE_WIDGET"
        const val WIDGET_CLASS  = "com.everlycare.app.EverlyCareWidget"
    }

    override fun definition() = ModuleDefinition {
        Name("WidgetSync")

        AsyncFunction("syncWidgetData") { jsonPayload: String ->
            val context = appContext.reactContext ?: return@AsyncFunction

            // Persist payload for the widget to read
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(DATA_KEY, jsonPayload)
                .apply()

            // Tell all EverlyCareWidget instances to redraw
            broadcastUpdate(context)
        }
    }

    private fun broadcastUpdate(context: Context) {
        try {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context.packageName, WIDGET_CLASS)
            val ids = manager.getAppWidgetIds(component)

            val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                component?.let { setComponent(it) }
            }
            context.sendBroadcast(intent)
        } catch (_: Exception) {
            // Widget not registered yet — safe to ignore
        }
    }
}
