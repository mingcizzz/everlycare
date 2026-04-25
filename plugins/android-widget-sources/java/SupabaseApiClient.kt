package com.everlycare.app

import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlin.concurrent.thread

/**
 * Minimal HTTP client for writing care_log rows to Supabase.
 * Uses HttpURLConnection only — no extra dependencies.
 * Calls are fire-and-forget on a background thread.
 */
class SupabaseApiClient(private val creds: Credentials) {

    data class Credentials(
        val supabaseUrl: String,
        val accessToken: String,
        val recipientId: String,
        val loggedBy: String,
    )

    /** Non-blocking — fires on a background thread. */
    fun insertCareLog(logType: String, dataJson: String) {
        thread(isDaemon = true) {
            runCatching { insertCareLogSync(logType, dataJson) }
        }
    }

    private fun insertCareLogSync(logType: String, dataJson: String) {
        val url = URL("${creds.supabaseUrl}/rest/v1/care_logs")
        val now = isoNow()

        // Build the JSON body — escape the inner data JSON as a raw JSONB string
        val body = """{"care_recipient_id":"${creds.recipientId}","logged_by":"${creds.loggedBy}","log_type":"$logType","occurred_at":"$now","data":$dataJson}"""

        val conn = url.openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.connectTimeout = 10_000
            conn.readTimeout    = 10_000
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Authorization", "Bearer ${creds.accessToken}")
            conn.setRequestProperty("Prefer", "return=minimal")

            OutputStreamWriter(conn.outputStream).use { it.write(body) }

            // 201 = created, 200 = ok — anything else is an error we ignore
            conn.responseCode
        } finally {
            conn.disconnect()
        }
    }

    private fun isoNow(): String {
        val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        fmt.timeZone = TimeZone.getTimeZone("UTC")
        return fmt.format(Date())
    }
}
