package com.everlycare.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class EverlyCareWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { id -> updateWidget(context, appWidgetManager, id) }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            ACTION_UPDATE    -> refreshAll(context)
            ACTION_TIMED     -> startCountdown(context)
            ACTION_DIRECT    -> { logUrination(context, seatedMinutes = null); clearCountdown(context) }
            ACTION_DONE      -> { logUrination(context, seatedMinutes = 3); clearCountdown(context) }
            ACTION_BOWEL     -> logBowel(context)
            ACTION_FLUID_200 -> logFluid(context, 200)
            ACTION_COUNTDOWN_FIRE -> {
                logUrination(context, seatedMinutes = 3)
                clearCountdown(context)
                refreshAll(context)
            }
        }
    }

    // ── Countdown ──────────────────────────────────────────────────────────

    private fun startCountdown(context: Context) {
        val endMs = System.currentTimeMillis() + COUNTDOWN_DURATION_MS
        prefs(context).edit().putLong(KEY_COUNTDOWN_END_MS, endMs).apply()

        // Schedule alarm to fire when countdown ends
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pi = countdownPendingIntent(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endMs, pi)
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, endMs, pi)
        }
        refreshAll(context)
    }

    private fun clearCountdown(context: Context) {
        prefs(context).edit().remove(KEY_COUNTDOWN_END_MS).apply()
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.cancel(countdownPendingIntent(context))
        refreshAll(context)
    }

    private fun countdownPendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, EverlyCareWidget::class.java).apply {
            action = ACTION_COUNTDOWN_FIRE
        }
        return PendingIntent.getBroadcast(
            context, RC_COUNTDOWN, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    // ── Supabase logging ───────────────────────────────────────────────────

    private fun logUrination(context: Context, seatedMinutes: Int?) {
        val creds = loadCredentials(context) ?: return
        val dataObj = JSONObject().apply {
            put("method", "planned")
            put("volume", "medium")
            put("isIncontinence", false)
            seatedMinutes?.let { put("seatedMinutes", it) }
        }
        SupabaseApiClient(creds).insertCareLog("urination", dataObj.toString())
    }

    private fun logBowel(context: Context) {
        val creds = loadCredentials(context) ?: return
        val dataObj = JSONObject().apply {
            put("type", "normal")
            put("isAccident", false)
            put("location", "toilet")
        }
        SupabaseApiClient(creds).insertCareLog("bowel", dataObj.toString())
    }

    private fun logFluid(context: Context, ml: Int) {
        val creds = loadCredentials(context) ?: return
        val dataObj = JSONObject().apply {
            put("mealType", "fluid")
            put("fluidAmountMl", ml)
            put("appetite", "good")
        }
        SupabaseApiClient(creds).insertCareLog("meal", dataObj.toString())
    }

    // ── UI update ──────────────────────────────────────────────────────────

    private fun refreshAll(context: Context) {
        val mgr  = AppWidgetManager.getInstance(context)
        val comp = ComponentName(context, EverlyCareWidget::class.java)
        mgr.getAppWidgetIds(comp).forEach { updateWidget(context, mgr, it) }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private fun loadCredentials(context: Context): SupabaseApiClient.Credentials? {
        val json = prefs(context).getString(KEY_DATA, null) ?: return null
        return try {
            val obj = JSONObject(json)
            val url   = obj.optString("supabaseUrl").takeIf { it.isNotEmpty() } ?: return null
            val token = obj.optString("accessToken").takeIf { it.isNotEmpty() } ?: return null
            val rid   = obj.optString("recipientId").takeIf { it.isNotEmpty() } ?: return null
            val by    = obj.optString("loggedBy").takeIf { it.isNotEmpty() } ?: return null
            SupabaseApiClient.Credentials(url, token, rid, by)
        } catch (_: Exception) { null }
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        const val PREFS_NAME = "everly_widget_prefs"
        const val KEY_DATA   = "everly_widget_data"
        const val KEY_COUNTDOWN_END_MS = "everly_widget_countdown_end_ms"

        const val ACTION_UPDATE        = "com.everlycare.app.UPDATE_WIDGET"
        const val ACTION_TIMED         = "com.everlycare.app.LOG_URINATION_TIMED"
        const val ACTION_DIRECT        = "com.everlycare.app.LOG_URINATION_DIRECT"
        const val ACTION_DONE          = "com.everlycare.app.CANCEL_TIMER"
        const val ACTION_BOWEL         = "com.everlycare.app.LOG_BOWEL"
        const val ACTION_FLUID_200     = "com.everlycare.app.LOG_FLUID_200"
        const val ACTION_COUNTDOWN_FIRE = "com.everlycare.app.COUNTDOWN_FIRE"

        const val RC_TIMED    = 101
        const val RC_DIRECT   = 102
        const val RC_DONE     = 103
        const val RC_BOWEL    = 104
        const val RC_FLUID    = 105
        const val RC_COUNTDOWN = 106

        const val COUNTDOWN_DURATION_MS = 3 * 60 * 1000L  // 3 minutes

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_everly_care)
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json  = prefs.getString(KEY_DATA, null)
            val endMs = prefs.getLong(KEY_COUNTDOWN_END_MS, 0L)
            val isCountdown = endMs > System.currentTimeMillis()

            // Parse payload
            val isZh: Boolean
            val predictionText: String
            val windowText: String
            if (json != null) {
                val obj   = runCatching { JSONObject(json) }.getOrNull()
                isZh      = obj?.optString("language") == "zh-CN"
                val pred  = obj?.optJSONObject("prediction")
                val diffMs = pred?.optString("predictedAt")?.let { parseIso(it) }
                    ?.let { it.time - System.currentTimeMillis() }
                val diffMin = diffMs?.div(60_000)?.toInt()
                predictionText = when {
                    diffMin == null  -> if (isZh) "暂无数据" else "No data"
                    diffMin > 0      -> if (isZh) "约 $diffMin 分钟后如厕" else "Toilet in ~$diffMin min"
                    diffMin == 0     -> if (isZh) "现在" else "Now!"
                    else             -> if (isZh) "超时 ${-diffMin} 分" else "Overdue ${-diffMin} min"
                }
                val startStr = pred?.optString("windowStartAt")?.let { formatTime(parseIso(it)) }
                val endStr   = pred?.optString("windowEndAt")?.let { formatTime(parseIso(it)) }
                windowText = if (startStr != null && endStr != null) "$startStr–$endStr" else ""
            } else {
                isZh           = false
                predictionText = "EverlyCare"
                windowText     = ""
            }

            // Toggle normal / countdown views
            if (isCountdown) {
                views.setViewVisibility(R.id.widget_normal_section, View.GONE)
                views.setViewVisibility(R.id.widget_countdown_section, View.VISIBLE)
                views.setViewVisibility(R.id.widget_action_bar_normal, View.GONE)
                views.setViewVisibility(R.id.widget_action_bar_countdown, View.VISIBLE)
                // Chronometer counts down to endMs
                views.setChronometer(R.id.widget_chronometer, endMs, null, true)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    views.setChronometerCountDown(R.id.widget_chronometer, true)
                }
                val doneLabel = if (isZh) "✓ 完成，立即记录" else "✓ Done — Log Now"
                views.setTextViewText(R.id.btn_done, doneLabel)
                views.setOnClickPendingIntent(R.id.btn_done, actionIntent(context, ACTION_DONE, RC_DONE))
            } else {
                views.setViewVisibility(R.id.widget_normal_section, View.VISIBLE)
                views.setViewVisibility(R.id.widget_countdown_section, View.GONE)
                views.setViewVisibility(R.id.widget_action_bar_normal, View.VISIBLE)
                views.setViewVisibility(R.id.widget_action_bar_countdown, View.GONE)
                views.setTextViewText(R.id.widget_prediction_text, predictionText)
                views.setTextViewText(R.id.widget_window_text, windowText)
                // Button labels
                views.setTextViewText(R.id.btn_timed, if (isZh) "⏱ 计时" else "⏱ Timer")
                views.setTextViewText(R.id.btn_direct, if (isZh) "⚡ 记录" else "⚡ Log")
                views.setTextViewText(R.id.btn_bowel, if (isZh) "🚽 大解" else "🚽 Bowel")
                views.setTextViewText(R.id.btn_fluid, if (isZh) "💧 200ml" else "💧 200ml")
                // PendingIntents
                views.setOnClickPendingIntent(R.id.btn_timed,  actionIntent(context, ACTION_TIMED,     RC_TIMED))
                views.setOnClickPendingIntent(R.id.btn_direct, actionIntent(context, ACTION_DIRECT,    RC_DIRECT))
                views.setOnClickPendingIntent(R.id.btn_bowel,  actionIntent(context, ACTION_BOWEL,     RC_BOWEL))
                views.setOnClickPendingIntent(R.id.btn_fluid,  actionIntent(context, ACTION_FLUID_200, RC_FLUID))
            }

            appWidgetManager.updateAppWidget(widgetId, views)
        }

        private fun actionIntent(context: Context, action: String, rc: Int): PendingIntent {
            val intent = Intent(context, EverlyCareWidget::class.java).apply { this.action = action }
            return PendingIntent.getBroadcast(
                context, rc, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun parseIso(s: String): Date? = runCatching {
            val fmt = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            fmt.parse(s.take(19))
        }.getOrNull()

        private fun formatTime(date: Date?): String? {
            date ?: return null
            return SimpleDateFormat("HH:mm", Locale.getDefault()).format(date)
        }
    }
}
